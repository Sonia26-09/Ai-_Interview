/**
 * Script to add manual questions + AI-generated questions to all 3 rounds
 * of the "Senior Fronted" interview.
 *
 * Run: node scratch/add-questions.mjs
 */

import mongoose from "mongoose";

const MONGODB_URI = "mongodb://localhost:27017/aimock";
const GEMINI_API_KEY = "AIzaSyA1ATzUqQ7Ch0xl_ertIGneMA-lWYqdUeU";

// ─── Gemini helper ──────────────────────────────────────────────────
async function callGemini(prompt) {
    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7, responseMimeType: "application/json" },
            }),
        }
    );
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    // Clean markdown fences if present
    const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    return JSON.parse(cleaned);
}

// ═════════════════════════════════════════════════════════════════════
async function main() {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected\n");

    const db = mongoose.connection.db;
    const interviewsCol = db.collection("interviews");
    const questionsCol = db.collection("questions");

    // Find the interview
    const interview = await interviewsCol.findOne({ title: "Senior Fronted" });
    if (!interview) {
        console.error("❌ Interview 'Senior Fronted' not found!");
        await mongoose.disconnect();
        process.exit(1);
    }

    const interviewId = interview._id;
    const rounds = interview.rounds || [];
    console.log(`📋 Interview: "${interview.title}" (${rounds.length} rounds)\n`);

    if (rounds.length < 3) {
        console.error("❌ Expected 3 rounds, found:", rounds.length);
        await mongoose.disconnect();
        process.exit(1);
    }

    // Clear existing questions for this interview
    const deleted = await questionsCol.deleteMany({ interviewId });
    if (deleted.deletedCount > 0) {
        console.log(`🗑️  Cleared ${deleted.deletedCount} existing questions\n`);
    }

    const aptitudeRound = rounds.find((r) => r.type === "aptitude");
    const codingRound = rounds.find((r) => r.type === "coding");
    const hrRound = rounds.find((r) => r.type === "hr");

    // ═══════════════════════════════════════════════════════════════
    // ROUND 1 — APTITUDE (5 manual + 15 AI = 20)
    // ═══════════════════════════════════════════════════════════════
    console.log("━".repeat(50));
    console.log("🧮 ROUND 1 — APTITUDE ROUND");
    console.log("━".repeat(50));

    const manualAptitude = [
        {
            interviewId,
            roundId: aptitudeRound._id.toString(),
            type: "aptitude",
            title: "Speed & Distance",
            description: "If a train travels 60 km in 1 hour, how far will it travel in 2.5 hours?",
            difficulty: "Easy",
            options: ["120 km", "150 km", "180 km", "90 km"],
            correctOption: 1,
            tags: ["speed-distance", "arithmetic"],
            points: 5,
            order: 1,
            isAIGenerated: false,
        },
        {
            interviewId,
            roundId: aptitudeRound._id.toString(),
            type: "aptitude",
            title: "Odd One Out",
            description: "Find the odd one out: 2, 4, 8, 16, 31, 64",
            difficulty: "Easy",
            options: ["8", "16", "31", "64"],
            correctOption: 2,
            tags: ["pattern", "series"],
            points: 5,
            order: 2,
            isAIGenerated: false,
        },
        {
            interviewId,
            roundId: aptitudeRound._id.toString(),
            type: "aptitude",
            title: "Coded Values",
            description: "If APPLE = 50, MANGO = 60, then BANANA = ?",
            difficulty: "Medium",
            options: ["40", "52", "48", "60"],
            correctOption: 1,
            tags: ["coding-decoding", "logic"],
            points: 5,
            order: 3,
            isAIGenerated: false,
        },
        {
            interviewId,
            roundId: aptitudeRound._id.toString(),
            type: "aptitude",
            title: "Blood Relations",
            description: "A is B's sister. C is B's mother. D is C's father. How is A related to D?",
            difficulty: "Medium",
            options: ["Grandmother", "Granddaughter", "Daughter", "Sister"],
            correctOption: 1,
            tags: ["blood-relations", "logic"],
            points: 5,
            order: 4,
            isAIGenerated: false,
        },
        {
            interviewId,
            roundId: aptitudeRound._id.toString(),
            type: "aptitude",
            title: "Percentage Calculation",
            description: "25% of 400 + 50% of 200 = ?",
            difficulty: "Easy",
            options: ["150", "180", "200", "220"],
            correctOption: 2,
            tags: ["percentage", "arithmetic"],
            points: 5,
            order: 5,
            isAIGenerated: false,
        },
    ];

    await questionsCol.insertMany(manualAptitude);
    console.log("  ✋ 5 manual questions added");

    // Generate 15 AI questions
    console.log("  🤖 Generating 15 AI aptitude questions...");
    const aptitudePrompt = `Generate exactly 15 MCQ aptitude questions for a Full Stack Developer job interview.

Topics to cover: Logical Reasoning, Quantitative Aptitude, Verbal Ability, Data Interpretation, Pattern Recognition.
Difficulty: Medium (mix of easy-medium).
Each question must have exactly 4 options and one correct answer.

Return a JSON array where each object has:
- "title": short title (2-4 words)
- "description": the question text
- "options": array of 4 option strings
- "correctOption": 0-based index of correct answer (0, 1, 2, or 3)
- "difficulty": "Easy" or "Medium"
- "tags": array of 1-2 topic tags

Return ONLY the JSON array, no extra text.`;

    try {
        const aiAptitude = await callGemini(aptitudePrompt);
        const aiDocs = aiAptitude.map((q, i) => ({
            interviewId,
            roundId: aptitudeRound._id.toString(),
            type: "aptitude",
            title: q.title || `Question ${i + 6}`,
            description: q.description,
            difficulty: q.difficulty || "Medium",
            options: q.options,
            correctOption: q.correctOption,
            tags: q.tags || [],
            points: 5,
            order: i + 6,
            isAIGenerated: true,
        }));
        await questionsCol.insertMany(aiDocs);
        console.log(`  ✅ ${aiDocs.length} AI questions generated & saved`);
    } catch (err) {
        console.error("  ❌ AI generation failed:", err.message);
    }

    // ═══════════════════════════════════════════════════════════════
    // ROUND 2 — CODING (3 manual + 2 AI = 5)
    // ═══════════════════════════════════════════════════════════════
    console.log("\n" + "━".repeat(50));
    console.log("💻 ROUND 2 — CODING ROUND");
    console.log("━".repeat(50));

    const manualCoding = [
        {
            interviewId,
            roundId: codingRound._id.toString(),
            type: "coding",
            title: "Reverse a String",
            description: `Write a function to reverse a string in JavaScript without using the reverse() method.

**Example:**
\`\`\`
Input: "hello"
Output: "olleh"
\`\`\`

**Constraints:**
- Do not use Array.reverse() or any built-in reverse method
- The function should handle empty strings
- Time complexity should be O(n)`,
            difficulty: "Medium",
            functionName: "reverseString",
            starterCode: {
                javascript: `/**\n * @param {string} str\n * @return {string}\n */\nfunction reverseString(str) {\n  // Write your solution here\n  \n}`,
                python: `def reverse_string(s: str) -> str:\n    # Write your solution here\n    pass`,
            },
            testCases: [
                { input: '"hello"', expectedOutput: '"olleh"', isHidden: false, description: "Basic case" },
                { input: '""', expectedOutput: '""', isHidden: false, description: "Empty string" },
                { input: '"a"', expectedOutput: '"a"', isHidden: true, description: "Single char" },
            ],
            tags: ["strings", "javascript"],
            points: 20,
            order: 1,
            isAIGenerated: false,
        },
        {
            interviewId,
            roundId: codingRound._id.toString(),
            type: "coding",
            title: "REST API — Get Users",
            description: `Write a REST API endpoint using Node.js/Express that returns a list of users from a database.

**Requirements:**
- Create a GET endpoint at \`/api/users\`
- Return a JSON array of user objects
- Each user should have: id, name, email, role
- Handle errors with proper status codes
- Include pagination support (page, limit query params)

**Example Response:**
\`\`\`json
{
  "users": [
    { "id": 1, "name": "John", "email": "john@example.com", "role": "developer" }
  ],
  "total": 50,
  "page": 1,
  "limit": 10
}
\`\`\``,
            difficulty: "Medium",
            tags: ["node.js", "express", "rest-api"],
            points: 25,
            order: 2,
            isAIGenerated: false,
        },
        {
            interviewId,
            roundId: codingRound._id.toString(),
            type: "coding",
            title: "React Data Fetcher Component",
            description: `Write a React component that fetches data from an API and displays it in a list.

**Requirements:**
- Use \`useEffect\` and \`useState\` hooks
- Fetch from \`https://jsonplaceholder.typicode.com/users\`
- Display each user's name and email in a styled list
- Show a loading spinner while fetching
- Handle and display errors gracefully
- Add a "Refresh" button to re-fetch data

**The component should handle 3 states:**
1. Loading state (spinner/skeleton)
2. Error state (error message + retry button)
3. Success state (rendered list of users)`,
            difficulty: "Medium",
            starterCode: {
                javascript: `import React, { useState, useEffect } from 'react';\n\nfunction UserList() {\n  // Write your solution here\n  \n  return (\n    <div>\n      {/* Render users here */}\n    </div>\n  );\n}\n\nexport default UserList;`,
            },
            tags: ["react", "hooks", "api"],
            points: 25,
            order: 3,
            isAIGenerated: false,
        },
    ];

    await questionsCol.insertMany(manualCoding);
    console.log("  ✋ 3 manual questions added");

    // Generate 2 AI coding questions
    console.log("  🤖 Generating 2 AI coding questions...");
    const codingPrompt = `Generate exactly 2 coding questions for a Full Stack Developer interview.

Topics: JavaScript/React, Node.js/REST API, Data Structures.
Difficulty: Medium.

Each question should be a practical coding challenge.

Return a JSON array where each object has:
- "title": short title (2-5 words)
- "description": detailed problem description with examples and constraints (use markdown formatting)
- "difficulty": "Medium"
- "tags": array of 2-3 tags
- "functionName": the function name to implement (e.g. "findDuplicates")
- "starterCode": object with "javascript" key containing starter code template

Return ONLY the JSON array.`;

    try {
        const aiCoding = await callGemini(codingPrompt);
        const aiDocs = aiCoding.map((q, i) => ({
            interviewId,
            roundId: codingRound._id.toString(),
            type: "coding",
            title: q.title || `Coding Challenge ${i + 4}`,
            description: q.description,
            difficulty: q.difficulty || "Medium",
            functionName: q.functionName,
            starterCode: q.starterCode,
            tags: q.tags || [],
            points: 25,
            order: i + 4,
            isAIGenerated: true,
        }));
        await questionsCol.insertMany(aiDocs);
        console.log(`  ✅ ${aiDocs.length} AI questions generated & saved`);
    } catch (err) {
        console.error("  ❌ AI generation failed:", err.message);
    }

    // ═══════════════════════════════════════════════════════════════
    // ROUND 3 — HR (7 manual + 3 AI = 10)
    // ═══════════════════════════════════════════════════════════════
    console.log("\n" + "━".repeat(50));
    console.log("🤝 ROUND 3 — HR ROUND");
    console.log("━".repeat(50));

    const manualHR = [
        {
            interviewId,
            roundId: hrRound._id.toString(),
            type: "hr",
            title: "Self Introduction",
            description: "Tell me about yourself and your experience as a Full Stack Developer.",
            difficulty: "Easy",
            expectedAnswer: "Looking for: clear introduction, relevant experience, key skills, passion for technology, concise and structured answer using STAR method.",
            tags: ["introduction", "experience"],
            points: 10,
            order: 1,
            isAIGenerated: false,
        },
        {
            interviewId,
            roundId: hrRound._id.toString(),
            type: "hr",
            title: "Motivation",
            description: "Why do you want to join our company?",
            difficulty: "Easy",
            expectedAnswer: "Looking for: research about company, alignment with company values, genuine interest, specific reasons not generic answers.",
            tags: ["motivation", "company-fit"],
            points: 10,
            order: 2,
            isAIGenerated: false,
        },
        {
            interviewId,
            roundId: hrRound._id.toString(),
            type: "hr",
            title: "Salary Expectations",
            description: "What is your expected salary?",
            difficulty: "Easy",
            expectedAnswer: "Looking for: market-aware answer, confidence, flexibility, justification based on skills and experience.",
            tags: ["salary", "negotiation"],
            points: 10,
            order: 3,
            isAIGenerated: false,
        },
        {
            interviewId,
            roundId: hrRound._id.toString(),
            type: "hr",
            title: "Notice Period",
            description: "What is your current notice period?",
            difficulty: "Easy",
            expectedAnswer: "Looking for: honest answer, willingness to negotiate, clarity on availability.",
            tags: ["logistics", "availability"],
            points: 10,
            order: 4,
            isAIGenerated: false,
        },
        {
            interviewId,
            roundId: hrRound._id.toString(),
            type: "hr",
            title: "Conflict Resolution",
            description: "Describe a situation where you handled a conflict in your team.",
            difficulty: "Medium",
            expectedAnswer: "Looking for: specific situation using STAR method, maturity in handling disagreements, focus on resolution and learning, empathy and communication skills.",
            tags: ["conflict", "teamwork", "behavioral"],
            points: 15,
            order: 5,
            isAIGenerated: false,
        },
        {
            interviewId,
            roundId: hrRound._id.toString(),
            type: "hr",
            title: "Strengths & Weaknesses",
            description: "What are your biggest strengths and weaknesses as a developer?",
            difficulty: "Easy",
            expectedAnswer: "Looking for: honest self-assessment, strengths backed by examples, weaknesses shown with improvement plan, self-awareness.",
            tags: ["self-awareness", "growth"],
            points: 10,
            order: 6,
            isAIGenerated: false,
        },
        {
            interviewId,
            roundId: hrRound._id.toString(),
            type: "hr",
            title: "Future Vision",
            description: "Where do you see yourself in 5 years?",
            difficulty: "Easy",
            expectedAnswer: "Looking for: ambition with realism, career growth plan, alignment with company growth, leadership aspirations.",
            tags: ["career-goals", "ambition"],
            points: 10,
            order: 7,
            isAIGenerated: false,
        },
    ];

    await questionsCol.insertMany(manualHR);
    console.log("  ✋ 7 manual questions added");

    // Generate 3 AI HR questions
    console.log("  🤖 Generating 3 AI HR questions...");
    const hrPrompt = `Generate exactly 3 HR/behavioral interview questions for a Full Stack Developer job interview.

Topics: Team Collaboration, Work-Life Balance, Career Goals.
Difficulty: Easy.

These should be open-ended behavioral questions.

Return a JSON array where each object has:
- "title": short title (2-4 words)
- "description": the full question text
- "difficulty": "Easy"
- "expectedAnswer": what a good answer should cover (evaluation criteria)
- "tags": array of 1-2 tags

Return ONLY the JSON array.`;

    try {
        const aiHR = await callGemini(hrPrompt);
        const aiDocs = aiHR.map((q, i) => ({
            interviewId,
            roundId: hrRound._id.toString(),
            type: "hr",
            title: q.title || `HR Question ${i + 8}`,
            description: q.description,
            difficulty: q.difficulty || "Easy",
            expectedAnswer: q.expectedAnswer,
            tags: q.tags || [],
            points: 10,
            order: i + 8,
            isAIGenerated: true,
        }));
        await questionsCol.insertMany(aiDocs);
        console.log(`  ✅ ${aiDocs.length} AI questions generated & saved`);
    } catch (err) {
        console.error("  ❌ AI generation failed:", err.message);
    }

    // ═══════════════════════════════════════════════════════════════
    // FINAL SUMMARY
    // ═══════════════════════════════════════════════════════════════
    const totalQuestions = await questionsCol.countDocuments({ interviewId });
    const r1Count = await questionsCol.countDocuments({ interviewId, roundId: aptitudeRound._id.toString() });
    const r2Count = await questionsCol.countDocuments({ interviewId, roundId: codingRound._id.toString() });
    const r3Count = await questionsCol.countDocuments({ interviewId, roundId: hrRound._id.toString() });

    console.log("\n" + "═".repeat(50));
    console.log("📊 FINAL SUMMARY");
    console.log("═".repeat(50));
    console.log(`  🧮 Aptitude Round: ${r1Count} questions`);
    console.log(`  💻 Coding Round:   ${r2Count} questions`);
    console.log(`  🤝 HR Round:       ${r3Count} questions`);
    console.log(`  ─────────────────────────`);
    console.log(`  📋 Grand Total:    ${totalQuestions} questions`);
    console.log("═".repeat(50));

    await mongoose.disconnect();
    console.log("\n✅ All done! Disconnected from MongoDB.");
}

main().catch((err) => {
    console.error("Script error:", err);
    process.exit(1);
});
