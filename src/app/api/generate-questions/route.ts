import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// ─── POST /api/generate-questions — Dynamically generate aptitude questions via Gemini ───
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            count = 5,
            difficulty = "Medium",
            topics = [],
            roundType = "aptitude",
        } = body;

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'GEMINI_API_KEY not set' },
                { status: 500 }
            );
        }

        const ai = new GoogleGenAI({ apiKey });

        if (roundType === "aptitude") {
            const topicHint = topics.length > 0
                ? `Focus on these topics: ${topics.join(", ")}.`
                : "Cover a mix of: logical reasoning, quantitative aptitude, data interpretation, probability, series & patterns, percentages, time & work, coding patterns.";

            const prompt = `You are a question bank generator for a competitive aptitude test platform.
Generate exactly ${count} unique MCQ aptitude questions.

DIFFICULTY: ${difficulty}
${topicHint}

RULES:
1. Each question must have exactly 4 options
2. Exactly one option must be correct
3. Questions should be challenging but fair
4. Mix different topics for variety
5. Points: Easy=4, Medium=6, Hard=8
6. Include clear, unambiguous descriptions
7. Each question needs a unique id like "gen-q1", "gen-q2", etc.

OUTPUT FORMAT — Return ONLY this JSON array, no extra text:
[
  {
    "id": "gen-q1",
    "type": "aptitude",
    "title": "<short topic label>",
    "description": "<full question text>",
    "difficulty": "${difficulty}",
    "options": ["<option A>", "<option B>", "<option C>", "<option D>"],
    "correctOption": <0-3 index of correct option>,
    "tags": ["<tag1>", "<tag2>"],
    "points": <4|6|8 based on difficulty>
  }
]

Generate exactly ${count} questions. Ensure variety in topics.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config: {
                    temperature: 0.7,
                    responseMimeType: 'application/json',
                },
            });

            const rawText = response.text || '';
            let questions;
            try {
                const cleaned = rawText
                    .replace(/^```json\s*/i, '')
                    .replace(/```\s*$/i, '')
                    .trim();
                questions = JSON.parse(cleaned);
            } catch {
                throw new Error(`Could not parse Gemini response: ${rawText.slice(0, 300)}`);
            }

            // Validate and ensure proper structure
            if (!Array.isArray(questions)) {
                throw new Error('Gemini did not return an array of questions');
            }

            // Ensure all questions have required fields
            questions = questions.map((q: any, i: number) => ({
                id: q.id || `gen-q${i + 1}`,
                type: "aptitude",
                title: q.title || `Question ${i + 1}`,
                description: q.description || "",
                difficulty: q.difficulty || difficulty,
                options: q.options || [],
                correctOption: typeof q.correctOption === 'number' ? q.correctOption : 0,
                tags: q.tags || [],
                points: q.points || (difficulty === "Easy" ? 4 : difficulty === "Medium" ? 6 : 8),
            }));

            return NextResponse.json({ questions }, { status: 200 });

        } else if (roundType === "coding") {
            // For coding, generate problem descriptions (not full test harnesses)
            const prompt = `You are a coding problem generator for a competitive coding interview platform.
Generate exactly ${count} unique coding problems.

DIFFICULTY: ${difficulty}

RULES:
1. Each problem should be a classic DSA/algorithmic problem
2. Include clear description with examples
3. Include 3 test cases each (2 visible, 1 hidden)
4. Include starter code for JavaScript
5. Include AI hints
6. Points: Easy=20, Medium=30, Hard=40

OUTPUT FORMAT — Return ONLY this JSON array:
[
  {
    "id": "gen-cq1",
    "type": "coding",
    "title": "<Problem Title>",
    "functionName": "<camelCaseFunctionName>",
    "description": "<Full problem description with examples and constraints>",
    "difficulty": "${difficulty}",
    "techStack": ["DSA"],
    "starterCode": {
      "javascript": "<starter code with function signature>",
      "python": "<starter code with class Solution>",
      "cpp": "<starter code with class Solution>"
    },
    "testCases": [
      {
        "id": "tc1",
        "input": "<input representation>",
        "expectedOutput": "<expected output>",
        "isHidden": false,
        "description": "<test case description>",
        "inputJs": "<JavaScript variable declarations>",
        "argsJs": "<comma separated arg names>"
      }
    ],
    "aiHints": ["<hint1>", "<hint2>", "<hint3>"],
    "tags": ["<tag1>", "<tag2>"],
    "points": <20|30|40>
  }
]

Generate exactly ${count} problems.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config: {
                    temperature: 0.7,
                    responseMimeType: 'application/json',
                },
            });

            const rawText = response.text || '';
            let questions;
            try {
                const cleaned = rawText
                    .replace(/^```json\s*/i, '')
                    .replace(/```\s*$/i, '')
                    .trim();
                questions = JSON.parse(cleaned);
            } catch {
                throw new Error(`Could not parse Gemini response: ${rawText.slice(0, 300)}`);
            }

            if (!Array.isArray(questions)) {
                throw new Error('Gemini did not return an array');
            }

            return NextResponse.json({ questions }, { status: 200 });
        }

        return NextResponse.json({ error: 'Invalid roundType' }, { status: 400 });

    } catch (err: any) {
        console.error('Generate questions error:', err.message);
        return NextResponse.json(
            { error: `Failed to generate questions: ${err.message}` },
            { status: 500 }
        );
    }
}
