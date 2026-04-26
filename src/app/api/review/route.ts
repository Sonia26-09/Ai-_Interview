import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// ─────────────────────────────────────────────────────────────────────────────
// Gemini-powered AI Code Reviewer — strict competitive-coding scoring rules.
// Follows the same evaluation philosophy as LeetCode / GFG / HackerRank:
//   → Correct code = 100/100, no exceptions
//   → Partial credit for partial correctness
//   → Never 0 for a working solution
//   → Order-insensitive comparison for set/pair answers
//   → Only report real errors
// ─────────────────────────────────────────────────────────────────────────────

interface ReviewRequest {
    code: string;
    language: string;
    problemTitle: string;
    problemDescription: string;
    testsPassed: number;
    testsTotal: number;
    hasCompileError: boolean;
    hasRuntimeError: boolean;
    errorMessage: string | null;
}

interface ReviewResponse {
    score: number;
    timeComplexity: string;
    spaceComplexity: string;
    whatYouDidWell: string[];
    whatToImprove: string[];
    modelApproach: string;
    errors: string[];
}

export async function POST(req: Request) {
    try {
        const body: ReviewRequest = await req.json();
        const {
            code,
            language,
            problemTitle,
            problemDescription,
            testsPassed,
            testsTotal,
            hasCompileError,
            hasRuntimeError,
            errorMessage,
        } = body;

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'GEMINI_API_KEY not set' },
                { status: 500 }
            );
        }

        const ai = new GoogleGenAI({ apiKey });

        // ── Build the scoring context for Gemini ─────────────────────────────
        const allPassed = testsPassed === testsTotal && testsTotal > 0;
        const hasError = hasCompileError || hasRuntimeError;

        let scoringContext: string;
        if (hasCompileError) {
            scoringContext = `COMPILE ERROR detected. The code failed to compile.\nError: ${errorMessage}\nScore MUST be 0. errors array MUST contain the compile error.`;
        } else if (hasRuntimeError) {
            scoringContext = `RUNTIME ERROR detected. The code crashed during execution.\nError: ${errorMessage}\nScore should be 0-20 depending on how close the logic is.`;
        } else if (allPassed) {
            scoringContext = `ALL ${testsTotal} TEST CASES PASSED.\n\nCRITICAL RULE: Score MUST be exactly 100. No exceptions.\nDo NOT deduct for brute force, O(n²), code style, or any other reason.\nThis is how LeetCode works — all tests pass = Accepted = full marks.\nerrors array MUST be empty [].`;
        } else if (testsPassed > 0) {
            const passRate = testsPassed / testsTotal;
            const suggestedMin = Math.round(passRate * 40 + 20);
            const suggestedMax = Math.round(passRate * 80 + 15);
            scoringContext = `PARTIAL: ${testsPassed}/${testsTotal} test cases passed.\nScore should be between ${suggestedMin}-${suggestedMax} (proportional to pass rate).\nGive credit for the correct logic, note what might be failing.`;
        } else {
            scoringContext = `ALL TEST CASES FAILED (0/${testsTotal}).\nScore should be 0-20. Be constructive, not harsh.`;
        }

        const prompt = `You are a strict but fair AI code reviewer for a competitive coding interview platform.
Your job is to review the student's submitted code and provide structured feedback.

═══════════════════════════════════════════════
PROBLEM
═══════════════════════════════════════════════
Title: ${problemTitle}
Description: ${problemDescription}

═══════════════════════════════════════════════
SUBMITTED CODE (${language})
═══════════════════════════════════════════════
\`\`\`${language}
${code}
\`\`\`

═══════════════════════════════════════════════
TEST RESULTS (from the evaluator)
═══════════════════════════════════════════════
${scoringContext}

═══════════════════════════════════════════════
SCORING RULES — YOU MUST FOLLOW THESE EXACTLY
═══════════════════════════════════════════════

RULE 1: CORRECT CODE = 100/100, NO EXCEPTIONS
If all test cases passed, the score MUST be 100. Period.
Do NOT deduct for brute force, O(n²), code style, formatting, or not using the "best" approach.

RULE 2: PARTIAL CREDIT
- Passes some tests → 40-80
- Correct logic, minor bug → 60-80
- Wrong output, right approach → 30-50
- Completely wrong → 0-20

RULE 3: NEVER 0 FOR WORKING CODE
A solution that compiles and runs can never be 0.

RULE 4: ORDER-INSENSITIVE
For set/pair answers (e.g., Two Sum indices), [0,1] and [1,0] are THE SAME.

RULE 5: ONLY REPORT REAL ERRORS
Never invent or hallucinate errors. Compiler warnings are NOT errors.
If code is correct, errors array MUST be empty [].

RULE 6: SUGGESTIONS ARE OPTIONAL IMPROVEMENTS
When score is 100, suggestions should be "level-up" tips, not corrections.
Use encouraging tone: "Great solution! Here's how to take it further..."

RULE 7: TONE
Be encouraging for correct solutions, constructive for incorrect ones.
Never harsh, dismissive, or condescending.

═══════════════════════════════════════════════
OUTPUT FORMAT — STRICT JSON ONLY
═══════════════════════════════════════════════

Return ONLY this JSON, no extra text:
{
  "score": <0-100>,
  "timeComplexity": "<e.g. O(n²)>",
  "spaceComplexity": "<e.g. O(1)>",
  "whatYouDidWell": [
    "<positive point 1>",
    "<positive point 2>"
  ],
  "whatToImprove": [
    "<optional improvement 1>",
    "<optional improvement 2>"
  ],
  "modelApproach": "<brief description of the optimal approach for reference>",
  "errors": []
}

REMINDER: If all tests passed → score = 100, errors = [], whatToImprove = only optional level-up suggestions.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
                temperature: 0,
                responseMimeType: 'application/json',
            },
        });

        const rawText = response.text || '';

        let parsed: ReviewResponse;
        try {
            const cleaned = rawText
                .replace(/^```json\s*/i, '')
                .replace(/```\s*$/i, '')
                .trim();
            parsed = JSON.parse(cleaned);
        } catch {
            throw new Error(
                `Could not parse Gemini review response: ${rawText.slice(0, 200)}`
            );
        }

        // ── Safety net: enforce scoring rules even if Gemini disobeys ────────
        if (allPassed && !hasError) {
            parsed.score = 100;
            parsed.errors = [];
        }

        if (hasCompileError) {
            parsed.score = 0;
            if (parsed.errors.length === 0 && errorMessage) {
                parsed.errors = [errorMessage];
            }
        }

        // Ensure arrays exist
        parsed.whatYouDidWell = parsed.whatYouDidWell || [];
        parsed.whatToImprove = parsed.whatToImprove || [];
        parsed.errors = parsed.errors || [];

        return NextResponse.json(parsed);
    } catch (err: any) {
        console.error('Review route error:', err.message);
        return NextResponse.json(
            { error: `Review failed: ${err.message}` },
            { status: 500 }
        );
    }
}
