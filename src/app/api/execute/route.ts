import { NextResponse } from 'next/server';
import { wrapCode } from '@/lib/codeWrapper';
import { TestCase } from '@/lib/types';

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/execute — LeetCode-style code execution via OnlineCompiler.io.
// If functionName + testCases are provided, wraps user code with test runner.
// Otherwise runs the code raw.
// ─────────────────────────────────────────────────────────────────────────────

const COMPILER_MAP: Record<string, string> = {
    python:     'python-3.14',
    javascript: 'typescript-deno',
    typescript: 'typescript-deno',
    c:          'gcc-15',
    cpp:        'g++-15',
    java:       'openjdk-25',
    go:         'go-1.26',
    rust:       'rust-1.93',
    php:        'php-8.5',
    ruby:       'ruby-4.0',
    csharp:     'dotnet-csharp-9',
};

const COMPILED_LANGS = ['c', 'cpp', 'java', 'go', 'rust', 'csharp'];
const SUPPORTED = Object.keys(COMPILER_MAP);

export async function POST(req: Request) {
    try {
        let body: any;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }

        const { code, language, stdin = '', functionName, testCases } = body as {
            code?: string;
            language?: string;
            stdin?: string;
            functionName?: string;
            testCases?: TestCase[];
        };

        if (!code || code.trim() === '') {
            return NextResponse.json({ error: 'Please write some code first' }, { status: 400 });
        }

        const langKey = language?.toLowerCase() || '';
        const compiler = COMPILER_MAP[langKey];
        if (!compiler) {
            return NextResponse.json(
                { error: `Language "${language}" is not supported. Supported: ${SUPPORTED.join(', ')}` },
                { status: 400 }
            );
        }

        const apiKey = process.env.ONLINECOMPILER_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'ONLINECOMPILER_API_KEY is not configured in .env.local' },
                { status: 503 }
            );
        }

        // ── Wrap code if LeetCode-style (functionName + testCases present) ──
        let finalCode = code;
        const isLeetCodeMode = functionName && testCases && testCases.length > 0;
        if (isLeetCodeMode) {
            finalCode = wrapCode(code, langKey, functionName, testCases);
        }

        // ── Send to OnlineCompiler.io ──
        const res = await fetch('https://api.onlinecompiler.io/api/run-code-sync/', {
            method: 'POST',
            headers: {
                'Authorization': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                compiler,
                code: finalCode,
                input: stdin,
            }),
        });

        if (!res.ok) {
            const errBody = await res.text().catch(() => '');
            console.error(`OnlineCompiler error ${res.status}: ${errBody}`);
            return NextResponse.json(
                { error: 'Execution service unavailable. Please try again.' },
                { status: 503 }
            );
        }

        const data = await res.json();

        const stdout = (data.output || '').trim();
        const errorOutput = (data.error || '').trim();
        const exitCode = data.exit_code ?? 0;
        const isCompiled = COMPILED_LANGS.includes(langKey);

        // ── Determine status ──
        let status: string = 'success';
        let stderr = '';
        let compile_error = '';

        if (data.status !== 'success' && errorOutput) {
            const isCompileError = isCompiled && (
                errorOutput.includes('error:') ||
                errorOutput.includes('undefined reference') ||
                errorOutput.includes('cannot find symbol') ||
                errorOutput.includes('expected') ||
                !stdout
            );

            if (isCompileError) {
                status = 'compile_error';
                compile_error = errorOutput;
            } else {
                status = 'runtime_error';
                stderr = errorOutput;
            }
        } else if (exitCode !== 0 && errorOutput) {
            status = 'runtime_error';
            stderr = errorOutput;
        }

        // ── Parse test results from stdout if in LeetCode mode ──
        let testResults: any = undefined;
        if (isLeetCodeMode && stdout) {
            const lines = stdout.split('\n');
            const results: { id: number; passed: boolean; expected?: string; got?: string }[] = [];
            let totalPassed = 0;
            let totalTests = 0;

            for (let i = 0; i < lines.length; i++) {
                const passMatch = lines[i].match(/Test Case (\d+): PASSED/);
                const failMatch = lines[i].match(/Test Case (\d+): FAILED/);
                const errMatch = lines[i].match(/Test Case (\d+): ERROR/);

                if (passMatch) {
                    results.push({ id: parseInt(passMatch[1]), passed: true });
                    totalPassed++;
                    totalTests++;
                } else if (failMatch) {
                    const tcId = parseInt(failMatch[1]);
                    let expected = '', got = '';
                    // Next lines may have Expected: and Got:
                    if (i + 1 < lines.length && lines[i + 1].includes('Expected:')) {
                        expected = lines[i + 1].replace(/.*Expected:\s*/, '').trim();
                    }
                    if (i + 2 < lines.length && lines[i + 2].includes('Got:')) {
                        got = lines[i + 2].replace(/.*Got:\s*/, '').trim();
                    }
                    results.push({ id: tcId, passed: false, expected, got });
                    totalTests++;
                } else if (errMatch) {
                    const tcId = parseInt(errMatch[1]);
                    const errMsg = lines[i].replace(/.*ERROR - /, '').trim();
                    results.push({ id: tcId, passed: false, expected: '', got: `ERROR: ${errMsg}` });
                    totalTests++;
                }
            }

            if (results.length > 0) {
                testResults = {
                    passed: totalPassed,
                    total: totalTests,
                    results,
                };
            }
        }

        return NextResponse.json({
            stdout,
            stderr,
            compile_error,
            status,
            exit_code: exitCode,
            time: data.time ? `${data.time}s` : undefined,
            memory: data.memory ? `${Math.round(data.memory / 1024)}KB` : undefined,
            testResults,
        });

    } catch (err: any) {
        console.error('Execution error:', err);
        return NextResponse.json(
            { error: 'Something went wrong. Please try again.' },
            { status: 500 }
        );
    }
}
