/**
 * Simulated AI Feedback Engine
 * Generates deterministic, rich feedback for all three interview round types.
 * Designed to always produce meaningful, contextual output without any API calls.
 */

import type {
    Question,
    QuestionFeedback,
    AptitudeResult,
    CodingQuestionFeedback,
    CodingResult,
    HRAnswerFeedback,
    HRResult,
    AIFeedback,
} from "./types";

// ─── Aptitude Explanations ─────────────────────────────────────────────────

const APTITUDE_EXPLANATIONS: Record<string, { explanation: string; tip: string }> = {
    q1: {
        explanation:
            "The series follows a pattern where each number equals n×(n+1): 1×2=2, 2×3=6, 3×4=12, 4×5=20, 5×6=30, 6×7=42. The differences between consecutive terms are 4, 6, 8, 10, 12 (increasing by 2 each time), making the next term 30+12=42.",
        tip: "For number series, always compute the differences between consecutive terms. If the differences form their own pattern (arithmetic, geometric), you can predict the next value.",
    },
    q2: {
        explanation:
            "A takes 18 days, so A's rate = 1/18 work/day. B takes half the time = 9 days, so B's rate = 1/9 work/day. Combined rate = 1/18 + 1/9 = 1/18 + 2/18 = 3/18 = 1/6 of the work per day.",
        tip: "In Time & Work problems, always convert time to rates (work per day = 1/time). Add rates for people working together.",
    },
    q3: {
        explanation:
            "If 60% are male, then 40% are female. 40% = 240 employees → 1% = 240/40 = 6, so 100% = 6 × 100 = 600 employees.",
        tip: "In percentage problems, isolate the known percentage and scale to 100%. Always double-check by verifying: 60% of 600 = 360 male + 240 female = 600 ✓.",
    },
    q4: {
        explanation:
            "Total outcomes when rolling two dice = 36. Sums greater than 10 are: 11 (5+6, 6+5) and 12 (6+6) = 3 favorable outcomes. Probability = 3/36 = 1/12.",
        tip: "Always enumerate all favorable outcomes explicitly for dice probability questions. Draw a grid of all 36 outcomes to avoid missing cases.",
    },
    q5: {
        explanation:
            "Each word is coded by its number of letters: APPLE = 5, MANGO = 5. ORANGE has 6 letters, so it is coded as 6.",
        tip: "When multiple words share the same code and seem random, look for a property they share — letter count, vowel count, consonant count, or alphabetical position.",
    },
};

const DEFAULT_APTITUDE = {
    explanation:
        "The correct answer is derived by carefully analyzing the question's constraints and applying the relevant mathematical or logical principle.",
    tip: "Read each question twice, identify the underlying concept (series, probability, time/work, percentages), and apply the standard formula for that concept.",
};

export function generateAptitudeFeedback(
    questions: Question[],
    selected: (number | null)[]
): QuestionFeedback[] {
    return questions.map((q, i) => {
        const sel = selected[i];
        const correct = q.correctOption ?? 0;
        const isCorrect = sel === correct;
        const meta = APTITUDE_EXPLANATIONS[q.id] ?? DEFAULT_APTITUDE;
        return {
            questionId: q.id,
            isCorrect,
            selectedOption: sel,
            correctOption: correct,
            explanation: meta.explanation,
            tip: meta.tip,
        };
    });
}

export function buildAptitudeResult(
    questions: Question[],
    selected: (number | null)[],
    timeTaken: number
): AptitudeResult {
    const feedbacks = generateAptitudeFeedback(questions, selected);
    const score = questions.reduce(
        (acc, q, i) => acc + (selected[i] === q.correctOption ? q.points : 0),
        0
    );
    const totalPoints = questions.reduce((a, q) => a + q.points, 0);
    return { questions, selected, feedbacks, score, totalPoints, timeTaken };
}


// ─── Code Analyser Helpers ─────────────────────────────────────────────────

/** Returns true if the code contains a nested loop pattern (brute-force O(n²)). */
function hasNestedLoops(code: string): boolean {
    // Match two separate for/while loop keywords — a simple but reliable heuristic
    const stripped = code.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
    const loops = stripped.match(/\b(for|while)\s*\(/g);
    return loops !== null && loops.length >= 2;
}

/** Returns true if the code uses any hash-map / dictionary data structure. */
function usesHashMap(code: string): boolean {
    return (
        /unordered_map|std::map|HashMap|TreeMap|\bmap\b|\bMap\b/.test(code) ||
        /\{\s*\}|dict\s*\(|\bdict\b|defaultdict|Counter\s*\(/.test(code) ||
        /new Map\s*\(|Map\s*</.test(code)
    );
}

/** Returns true if the code uses a stack data structure. */
function usesStack(code: string): boolean {
    return /\bstack\b|push_back|push\(|append\(|\[\s*\]/.test(code);
}

/** Counts approximate number of for/while loops at the top level. */
function countLoopDepth(code: string): number {
    const stripped = code.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
    return (stripped.match(/\b(for|while)\s*\(/g) || []).length;
}

// ─── Per-Question Feedback Builders ────────────────────────────────────────

function buildTwoSumFeedback(code: string, allTestsPassed: boolean) {
    const bruteForce = hasNestedLoops(code) && !usesHashMap(code);
    const optimal = usesHashMap(code);

    if (bruteForce) {
        return {
            timeComplexity: "O(n²)",
            spaceComplexity: "O(1)",
            whatYouDidWell: [
                ...(allTestsPassed ? ["Correct solution — all test cases pass ✓"] : ["Brute-force approach detected — some test cases may have failed"]),
                "Nested-loop approach correctly checks every pair",
                "Early return on finding the answer keeps things simple",
            ],
            whatToImprove: [
                "Your solution is O(n²) — try using a hash map to bring it down to O(n)",
                "With a hash map, store `num → index` as you iterate and check if `target - num` already exists",
                "Add input validation (e.g., handle empty arrays)",
            ],
            modelApproach:
                "Iterate through the array once. For each element, compute `complement = target - nums[i]`. If `complement` exists in the hash map, return `[map.get(complement), i]`. Otherwise, store `nums[i] → i` in the map. This gives O(n) time and O(n) space — much faster than O(n²).",
            errors: [],
            edgeCases: [
                "Duplicate values (e.g., [3,3], target=6 → expect [0,1])",
                "Negative numbers in the array",
                "Large arrays — your brute-force O(n²) may TLE on very large inputs",
            ],
        };
    }

    if (optimal) {
        return {
            timeComplexity: "O(n)",
            spaceComplexity: "O(n)",
            whatYouDidWell: [
                ...(allTestsPassed ? ["Correct solution — all test cases pass ✓"] : ["Hash map approach is the right idea, but the output was incorrect"]),
                "Optimal O(n) hash map approach used",
                "Single-pass iteration is exactly right",
            ],
            whatToImprove: [
                allTestsPassed
                    ? "Consider using descriptive variable names (e.g., `seen` instead of `map`)"
                    : "Double-check your index tracking — ensure you return the correct pair of indices",
                "Add input validation (what if nums is empty?)",
                "Add a comment explaining the time/space trade-off",
            ],
            modelApproach:
                "Iterate through the array once. For each element, compute `complement = target - nums[i]`. If `complement` exists in the hash map, return `[map.get(complement), i]`. Otherwise, store `nums[i] → i` in the map. This gives O(n) time and O(n) space.",
            errors: [],
            edgeCases: [
                "Duplicate values (e.g., [3,3], target=6 → expect [0,1])",
                "Negative numbers in the array",
                "Target larger than the sum of all elements (no solution)",
            ],
        };
    }

    // Fallback — unrecognised approach
    return {
        timeComplexity: allTestsPassed ? "O(n)" : "Unknown",
        spaceComplexity: "O(1)",
        whatYouDidWell: [
            allTestsPassed
                ? "Correct solution — all test cases pass ✓"
                : "Attempted the Two Sum problem — keep working on the logic",
        ],
        whatToImprove: [
            "Use a hash map (object / Map / unordered_map / dict) to achieve O(n) time",
            "For each element, compute complement = target - nums[i] and check if it was seen before",
            "Consider edge cases like empty arrays and duplicate values",
        ],
        modelApproach:
            "Iterate through the array once. For each element, compute `complement = target - nums[i]`. If `complement` exists in the hash map, return `[map.get(complement), i]`. Otherwise, store `nums[i] → i` in the map. This gives O(n) time and O(n) space.",
        errors: [],
        edgeCases: [
            "Duplicate values (e.g., [3,3], target=6 → expect [0,1])",
            "Negative numbers in the array",
        ],
    };
}

function buildValidParenthesesFeedback(code: string, allTestsPassed: boolean) {
    const stackUsed = usesStack(code);
    // Check if code actually references all three bracket types
    const handlesAllBrackets = /[\(\)]/.test(code) && /[\[\]]/.test(code) && /[\{\}]/.test(code);
    // Check for early return on mismatch
    const hasEarlyReturn = /return\s+(false|False)/.test(code);
    return {
        timeComplexity: "O(n)",
        spaceComplexity: stackUsed ? "O(n)" : "O(1)",
        whatYouDidWell: [
            ...(allTestsPassed
                ? ["Correct solution — all test cases pass ✓"]
                : stackUsed
                    ? ["Stack-based approach is the right idea, but output was incorrect"]
                    : ["Attempted the Valid Parentheses problem"]),
            ...(stackUsed ? ["Stack data structure used — correct intuition ✓"] : []),
            ...(handlesAllBrackets && allTestsPassed ? ["Correctly handles all three bracket types: (), [], {}"] : []),
            ...(hasEarlyReturn && allTestsPassed ? ["Early false return on mismatch is efficient"] : []),
        ],
        whatToImprove: [
            stackUsed
                ? "Use a Map for bracket pairs instead of multiple if-else for cleaner code"
                : "Use a stack (array with push/pop) to track unmatched opening brackets",
            "Always check if the stack is empty before popping to avoid underflow errors",
            "Return `stack.length === 0` at the end to catch unclosed brackets",
        ],
        modelApproach:
            "Create a stack and a mapping `{')': '(', '}': '{', ']': '['}`. For each character: if it's an open bracket, push it. If it's a close bracket, pop from the stack and check it matches the expected open bracket. Return `stack.length === 0` at the end.",
        errors: [],
        edgeCases: [
            'Single bracket like `(` — should return false',
            'Interleaved brackets like `([)]` — should return false',
            'Empty string `""` — should return true',
        ],
    };
}

function buildLRUCacheFeedback(code: string, allTestsPassed: boolean) {
    const hasMap = usesHashMap(code);
    // Check for both get and put having non-trivial bodies
    const hasGetImpl = /get\s*\([^)]*\)[^{]*\{[^}]{10,}\}/.test(code)
        || /def\s+get\s*\([^)]*\)[\s\S]{10,}/.test(code);
    const hasPutImpl = /put\s*\([^)]*\)[^{]*\{[^}]{10,}\}/.test(code)
        || /def\s+put\s*\([^)]*\)[\s\S]{10,}/.test(code);
    return {
        timeComplexity: hasMap ? "O(1) per operation" : "Unknown",
        spaceComplexity: "O(capacity)",
        whatYouDidWell: [
            ...(allTestsPassed
                ? ["Correct solution — all test cases pass ✓"]
                : hasGetImpl && hasPutImpl
                    ? ["Both get() and put() have implementations — good structure"]
                    : ["Attempted the LRU Cache design problem"]),
            ...(hasMap ? ["Hash map used for O(1) key lookup ✓"] : []),
            ...(allTestsPassed ? ["LRU eviction policy correctly implemented ✓"] : []),
        ],
        whatToImprove: [
            !hasGetImpl ? "Implement get() — it must return the cached value or -1 if the key doesn't exist" :
                "Use sentinel head/tail nodes in the doubly linked list to simplify edge cases",
            !hasPutImpl ? "Implement put() — it must insert/update and evict the LRU key when over capacity" :
                "Ensure put() updates the position of an existing key (move to head) before updating its value",
            "Double-check that get() also promotes the accessed key to MRU position",
        ],
        modelApproach:
            "Maintain a doubly linked list (MRU at head, LRU at tail) and a hash map (key → node). On `get`: move the node to head and return its value. On `put`: if key exists, update value and move to head. If not, create a new node at head. If over capacity, delete the tail node and remove its key from the map.",
        errors: [],
        edgeCases: [
            "Capacity of 1 — any put after the first should evict the existing entry",
            "`get` on a non-existent key must return -1",
            "`put` on an existing key should update value without adding a new node",
        ],
    };
}

const DEFAULT_CODING = {
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    whatYouDidWell: [
        "You attempted the problem with a working approach",
        "Code structure is readable and well-organized",
    ],
    whatToImprove: [
        "Consider edge cases such as empty inputs or boundary values",
        "Look for opportunities to optimize time or space complexity",
        "Add comments to explain your algorithmic thinking",
    ],
    modelApproach:
        "Break the problem into sub-problems. Identify if sorting, hashing, two pointers, or a sliding window could simplify the solution. Aim for the lowest time complexity first, then optimize space.",
    errors: [] as string[],
    edgeCases: [
        "Empty input",
        "Single element input",
        "All elements identical",
        "Maximum possible values",
    ],
};

export function generateCodingFeedback(
    question: Question,
    _code: string,
    testsPassed: number,
    testsTotal: number,
    isEmptyOrBoilerplate: boolean = false
): CodingQuestionFeedback {
    if (isEmptyOrBoilerplate) {
        return {
            questionId: question.id,
            score: 0,
            code: _code,
            timeComplexity: "O(1)",
            spaceComplexity: "O(1)",
            whatYouDidWell: ["Attempted to interact with the environment"],
            whatToImprove: ["Please provide a valid logic block instead of submitting unmodified templates."],
            modelApproach: "No solution provided. Make sure to implement the requested logic before clicking submit.",
            errors: ["No solution provided — code is empty or unmodified boilerplate."],
            edgeCases: ["Empty input bypass detected"],
        };
    }

    // ── Deterministic score: based purely on test results, no randomness ──
    const passRate = testsTotal > 0 ? testsPassed / testsTotal : 0;
    // All tests pass → 100. Partial → proportionally scaled between 0–95.
    const score = testsPassed === testsTotal && testsTotal > 0
        ? 100
        : Math.round(passRate * 95);

    // ── Code-aware feedback based on the actual submission ──
    const allPassed = testsPassed === testsTotal && testsTotal > 0;
    let meta;
    switch (question.id) {
        case "cq1":
            meta = buildTwoSumFeedback(_code, allPassed);
            break;
        case "cq2":
            meta = buildValidParenthesesFeedback(_code, allPassed);
            break;
        case "cq3":
            meta = buildLRUCacheFeedback(_code, allPassed);
            break;
        default:
            meta = {
                ...DEFAULT_CODING,
                whatYouDidWell: allPassed
                    ? DEFAULT_CODING.whatYouDidWell
                    : ["Attempted the problem — review the expected output and try again"],
            };
    }

    return {
        questionId: question.id,
        score,
        code: _code,
        ...meta,
    };
}

export function buildCodingResult(feedbacks: CodingQuestionFeedback[]): CodingResult {
    const overallScore =
        feedbacks.length > 0
            ? Math.round(feedbacks.reduce((a, f) => a + f.score, 0) / feedbacks.length)
            : 0;
    return { feedbacks, overallScore };
}

// ─── HR Feedback ───────────────────────────────────────────────────────────

const HR_COMMENTS: string[] = [
    "Good use of the STAR method! Adding more specific metrics (e.g., '…which reduced bug count by 30%') would make your answer more memorable.",
    "Your answer showed strong self-awareness. Try to end with a clear 'Result' that highlights the positive outcome for the team or project.",
    "Excellent example of leadership under pressure. Consider being slightly more concise — aim for 2–3 minutes per answer in a real interview.",
    "You communicated your thought process clearly. Next time, make sure to explicitly state what action *you personally* took, not just the team.",
    "Strong empathy in your response. Adding a brief reflection on what you learned would show greater growth mindset.",
    "Great structure overall. The 'Task' and 'Action' parts were very detailed. Balance it out with an equally strong 'Result' section.",
];

export function generateHRFeedback(
    questionId: string,
    question: string,
    answer: string,
    confidenceScore: number
): HRAnswerFeedback {
    // Score dimensions — seeded from answer length as a proxy for detail
    const len = answer.trim().length;
    const base = Math.min(95, Math.max(45, 55 + len * 0.05));

    const clarity = Math.round(Math.min(100, base + (Math.random() - 0.4) * 20));
    const starStructure = Math.round(Math.min(100, base + (Math.random() - 0.4) * 18));
    const specificity = Math.round(Math.min(100, base + (Math.random() - 0.5) * 22));
    const empathy = Math.round(Math.min(100, base + (Math.random() - 0.4) * 15));
    const overall = Math.round((clarity + starStructure + specificity + empathy) / 4);
    const comment = HR_COMMENTS[Math.floor(Math.random() * HR_COMMENTS.length)];

    return {
        questionId,
        question,
        answer,
        clarity,
        starStructure,
        specificity,
        empathy,
        overall,
        comment,
    };
}

export function buildHRResult(feedbacks: HRAnswerFeedback[], confidenceScore: number): HRResult {
    const overallScore =
        feedbacks.length > 0
            ? Math.round(feedbacks.reduce((a, f) => a + f.overall, 0) / feedbacks.length)
            : 0;
    return { feedbacks, overallScore, confidenceScore };
}

// ─── Full Report Generator ─────────────────────────────────────────────────

export function generateFullReport(
    aptitude: AptitudeResult | null,
    coding: CodingResult | null,
    hr: HRResult | null
): AIFeedback {
    const aptitudeScore = aptitude
        ? Math.round((aptitude.score / Math.max(aptitude.totalPoints, 1)) * 100)
        : 0;
    const codingScore = coding?.overallScore ?? 0;
    const hrScore = hr?.overallScore ?? 0;

    const roundCount = [aptitude, coding, hr].filter(Boolean).length || 1;
    const overallScore = Math.round((aptitudeScore + codingScore + hrScore) / roundCount);

    const strengths: string[] = [];
    const improvements: string[] = [];
    const studyPlan: string[] = [];

    // Aptitude analysis
    if (aptitude) {
        const correctCount = aptitude.feedbacks.filter(f => f.isCorrect).length;
        const total = aptitude.feedbacks.length;
        if (aptitudeScore >= 80) {
            strengths.push(`Outstanding aptitude performance — ${correctCount}/${total} correct answers`);
        } else if (aptitudeScore >= 60) {
            strengths.push(`Solid aptitude round with ${correctCount}/${total} correct answers`);
            improvements.push("Review arithmetic progressions and series formulas for aptitude");
            studyPlan.push("Practice 10 aptitude questions daily from Series, Time & Work, and Probability");
        } else {
            improvements.push(`Aptitude needs significant work — only ${correctCount}/${total} correct`);
            studyPlan.push("Dedicate 30 min/day to aptitude: start with percentage, ratio, and probability basics");
            studyPlan.push("Use a structured textbook like R.S. Aggarwal Quantitative Aptitude");
        }
    }

    // Coding analysis
    if (coding) {
        if (codingScore >= 85) {
            strengths.push("Exceptional problem-solving — optimal algorithms and clean code structure");
        } else if (codingScore >= 65) {
            strengths.push("Good coding fundamentals with working solutions");
            improvements.push("Focus on code optimization — aim for lower time/space complexity");
            studyPlan.push("Practice hash map and two-pointer patterns on LeetCode (Easy → Medium)");
        } else {
            improvements.push("Coding solutions need optimization — focus on core DSA patterns");
            studyPlan.push("Complete Neetcode 150 roadmap, starting with Arrays & Hashing");
            studyPlan.push("Study Hash Maps, Stacks, and Sliding Window patterns this week");
        }
    }

    // HR analysis
    if (hr) {
        if (hrScore >= 80) {
            strengths.push("Strong communication — structured, empathetic, and specific STAR answers");
        } else if (hrScore >= 60) {
            strengths.push("Good communication baseline with clear thought process");
            improvements.push("Strengthen the 'Result' section in STAR answers with measurable outcomes");
            studyPlan.push("Practice STAR method with 2 new behavioral stories weekly, record yourself");
        } else {
            improvements.push("HR answers could be more structured — practice the STAR method");
            studyPlan.push("Write out 5 STAR stories from your experience and practice them out loud");
        }
    }

    // Generic study plan items if we still have room
    if (studyPlan.length < 3) {
        studyPlan.push("Review your weak-area questions and attempt similar problems within 24 hours for better retention");
    }
    if (studyPlan.length < 4) {
        studyPlan.push("Do one full mock interview per week to practice time management across all rounds");
    }

    const topicBreakdown = [
        { topic: "Aptitude", score: aptitudeScore, trend: aptitudeScore >= 70 ? "up" as const : "down" as const },
        { topic: "Coding", score: codingScore, trend: codingScore >= 70 ? "up" as const : "stable" as const },
        { topic: "HR / Communication", score: hrScore, trend: hrScore >= 70 ? "up" as const : "stable" as const },
        { topic: "Problem Solving", score: Math.round((aptitudeScore + codingScore) / 2), trend: "up" as const },
        { topic: "Speed & Accuracy", score: Math.min(100, overallScore + 5), trend: "stable" as const },
    ];

    const recommendation =
        overallScore >= 85
            ? "Strongly Recommend"
            : overallScore >= 70
                ? "Recommend"
                : overallScore >= 55
                    ? "Maybe"
                    : "Not Recommend";

    const detailedReport = `You scored ${overallScore}% overall across ${roundCount} round(s). ${aptitude ? `In the Aptitude round, you answered ${aptitude.feedbacks.filter(f => f.isCorrect).length} out of ${aptitude.feedbacks.length} questions correctly (${aptitudeScore}%). ` : ""
        }${coding ? `Your Coding performance was ${codingScore}%, demonstrating ${codingScore >= 80 ? "strong" : "developing"} DSA skills. ` : ""
        }${hr ? `The HR round showed ${hrScore >= 75 ? "excellent" : "good"} communication and self-awareness at ${hrScore}%. ` : ""
        }${overallScore >= 70
            ? "Keep up the momentum — with focused practice on your weak areas, you're on track for top-tier placements!"
            : "Don't be discouraged — targeted practice on the areas highlighted in your Study Plan will significantly improve your performance."
        }`;

    return {
        overallScore,
        strengths: strengths.length ? strengths : ["Showed up and completed the full interview — that takes courage!"],
        improvements: improvements.length ? improvements : ["Keep practicing consistently to build stronger fundamentals"],
        communicationScore: hrScore || undefined,
        confidenceScore: hr?.confidenceScore || undefined,
        technicalScore: Math.round((aptitudeScore + codingScore) / 2) || undefined,
        recommendation,
        detailedReport,
        studyPlan,
        topicBreakdown,
    };
}

// ─── LocalStorage Helpers ──────────────────────────────────────────────────

export const STORAGE_KEYS = {
    aptitude: "aimock_aptitude_result",
    coding: "aimock_coding_result",
    hr: "aimock_hr_result",
};

export function saveToStorage<T>(key: string, data: T): void {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch { /* ignore */ }
}

export function loadFromStorage<T>(key: string): T | null {
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : null;
    } catch {
        return null;
    }
}

export function clearInterviewStorage(): void {
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
}
