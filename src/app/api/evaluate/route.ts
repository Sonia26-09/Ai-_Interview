import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import vm from 'vm';

// ─────────────────────────────────────────────────────────────────────────────
// Gemini-powered code evaluator — uses the same GEMINI_API_KEY already in use
// by the HR chat. Acts as a virtual compiler: detects syntax errors (missing
// semicolons, undeclared variables, wrong types, etc.) AND traces logic for
// each test case. No new API keys or card details needed.
// ─────────────────────────────────────────────────────────────────────────────

type LangId = 'javascript' | 'python' | 'c' | 'cpp';

// ── Gemini evaluator ─────────────────────────────────────────────────────────
interface GeminiEvalResult {
    passed: number;
    total: number;
    results: boolean[];
    error?: string;
    compileError?: boolean;
    runtimeError?: boolean;
}

async function evaluateWithGemini(
    code: string,
    language: LangId,
    testCases: { input: string; expectedOutput: string }[]
): Promise<GeminiEvalResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not set in .env.local');

    const ai = new GoogleGenAI({ apiKey });

    const testCasesText = testCases
        .map((tc, i) => `Test ${i + 1}: Input = ${tc.input} | Expected Output = ${tc.expectedOutput}`)
        .join('\n');

    const langLabel: Record<LangId, string> = {
        cpp: 'C++ (GCC standard)',
        c: 'C (GCC standard)',
        python: 'Python 3',
        javascript: 'JavaScript',
    };

    const prompt = `You are a strict ${langLabel[language]} compiler and runtime executor. Analyze this code with maximum strictness — exactly like GCC/CPython would.

## Code
\`\`\`${language}
${code}
\`\`\`

## Test Cases
${testCasesText}

## Your Task — be STRICT like a real compiler:

**STEP 1 — Syntax & Compile Check:**
- Missing semicolons (;) after statements in C/C++ → compile error
- Variable used without declaration (e.g., using \`mpp\` when only \`map<int,int>\` was written without variable name) → compile error
- Wrong declaration like \`map<int,int>\` without a name (should be \`map<int,int> mpp;\`) → compile error
- Missing brackets/braces → compile error
- Python indentation errors → syntax error
- Empty/stub function body that does nothing → logic error, all tests fail

**STEP 2 — Logic Trace (only if no compile error):**
- Trace through the actual code logic for EACH test case
- Compute the EXACT output the code produces
- Compare to expected — if different, mark as failed
- Wrong logic = fail, even if code compiles

**RULES:**
- Never pass code with syntax/compile errors
- Never assume code "probably works" — trace it precisely
- A function that just does \`return {};\` or \`return ans\` when ans is empty → all tests fail

Respond with ONLY valid JSON (no markdown fences, no extra text):
{
  "syntaxError": null,
  "runtimeError": null,
  "testResults": [
    { "testNumber": 1, "passed": true, "actualOutput": "..." },
    { "testNumber": 2, "passed": false, "actualOutput": "..." }
  ]
}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
            temperature: 0,
            responseMimeType: 'application/json',
        },
    });

    const rawText = response.text || '';

    // Parse JSON — strip markdown fences if present
    let parsed: any;
    try {
        const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
        parsed = JSON.parse(cleaned);
    } catch {
        throw new Error(`Could not parse Gemini response: ${rawText.slice(0, 200)}`);
    }

    // Syntax / compile error
    if (parsed.syntaxError && parsed.syntaxError !== null && parsed.syntaxError !== 'null') {
        return {
            passed: 0, total: testCases.length,
            results: testCases.map(() => false),
            error: `Compilation Error:\n${parsed.syntaxError}`,
            compileError: true,
        };
    }

    // Runtime error
    if (parsed.runtimeError && parsed.runtimeError !== null && parsed.runtimeError !== 'null') {
        return {
            passed: 0, total: testCases.length,
            results: testCases.map(() => false),
            error: `Runtime Error:\n${parsed.runtimeError}`,
            runtimeError: true,
        };
    }

    // Test results
    const testResults: boolean[] = Array.isArray(parsed.testResults)
        ? parsed.testResults.map((r: any) => Boolean(r.passed))
        : testCases.map(() => false);

    while (testResults.length < testCases.length) testResults.push(false);
    const results = testResults.slice(0, testCases.length);
    const passed = results.filter(Boolean).length;

    return { passed, total: testCases.length, results };
}

// ── JavaScript VM executor (real execution, no AI needed) ────────────────────
function normalizeForCompare(value: any): string {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'boolean') return String(value);
    if (typeof value === 'number') return String(value);
    if (typeof value === 'string') return value.trim().toLowerCase();
    if (Array.isArray(value)) {
        return JSON.stringify([...value].map(Number).sort((a, b) => a - b));
    }
    return JSON.stringify(value);
}

function normalizeExpected(s: string): string {
    const t = s.trim();
    try {
        const p = JSON.parse(t);
        if (Array.isArray(p)) return JSON.stringify([...p].map(Number).sort((a, b) => a - b));
        if (typeof p === 'boolean') return String(p);
        return JSON.stringify(p);
    } catch {
        return t.toLowerCase().replace(/\s+/g, '');
    }
}

function runJavaScript(code: string, testCases: any[]): {
    passed: number; total: number; results: boolean[]; error?: string;
} {
    const funcMatch = code.match(/function\s+([a-zA-Z0-9_]+)\s*\(/);
    const arrowMatch = code.match(/(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=/);
    const classMatch = code.match(/class\s+([a-zA-Z0-9_]+)\s*\{/);
    const funcName = funcMatch?.[1] || arrowMatch?.[1] || '';

    if (!funcName && !classMatch) {
        return {
            passed: 0, total: testCases.length,
            results: testCases.map(() => false),
            error: 'Could not detect a function or class name. Make sure you define a function.',
        };
    }

    const results = testCases.map((tc: any) => {
        try {
            const sandbox: any = { result: undefined, console: { log: () => {} }, JSON };
            vm.createContext(sandbox);
            let script = code + '\n';
            // For class-based (LRU Cache), check structure
            if (classMatch && !funcName) {
                const hasGet = /get\s*\(/.test(code);
                const hasPut = /put\s*\(/.test(code);
                const hasBody = code.replace(/\/\/[^\n]*/g, '').replace(/\s+/g, '').length > 150;
                return hasGet && hasPut && hasBody;
            }
            script += `result = ${funcName}(${tc.input});`;
            vm.runInContext(script, sandbox, { timeout: 3000 });
            return normalizeForCompare(sandbox.result) === normalizeExpected(tc.expectedOutput);
        } catch {
            return false;
        }
    });

    return {
        passed: results.filter(Boolean).length,
        total: testCases.length,
        results,
    };
}

// ── Main handler ─────────────────────────────────────────────────────────────
export async function POST(req: Request) {
    try {
        const { code, testCases, language } = await req.json() as {
            code: string;
            testCases: { input: string; expectedOutput: string; isHidden?: boolean }[];
            language: LangId;
        };

        if (!code?.trim()) {
            return NextResponse.json({
                passed: 0, total: testCases.length,
                results: testCases.map(() => false),
                error: 'No code provided.',
            });
        }

        // ── JavaScript: real Node.js VM execution ─────────────────────────────
        if (language === 'javascript') {
            const result = runJavaScript(code, testCases);
            return NextResponse.json(result);
        }

        // ── C++, C, Python: Gemini as virtual compiler + runtime ──────────────
        try {
            const result = await evaluateWithGemini(code, language, testCases);
            return NextResponse.json(result);
        } catch (err: any) {
            console.error('Gemini evaluation error:', err.message);
            return NextResponse.json({
                passed: 0, total: testCases.length,
                results: testCases.map(() => false),
                error: `Evaluation error: ${err.message}. Please try again.`,
            });
        }

    } catch (err) {
        console.error('Evaluate route error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
