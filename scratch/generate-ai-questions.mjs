/**
 * Retry script — generates AI questions for all 3 rounds.
 * Run: node scratch/generate-ai-questions.mjs
 */

import mongoose from "mongoose";

const MONGODB_URI = "mongodb://localhost:27017/aimock";
const GEMINI_API_KEY = "AIzaSyA1ATzUqQ7Ch0xl_ertIGneMA-lWYqdUeU";

async function callGemini(prompt) {
    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.8 },
            }),
        }
    );
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    console.log("    Raw Gemini response length:", text.length, "chars");
    // Extract JSON from response (handle markdown fences)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON array found in Gemini response");
    return JSON.parse(jsonMatch[0]);
}

async function main() {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected\n");

    const db = mongoose.connection.db;
    const interviewsCol = db.collection("interviews");
    const questionsCol = db.collection("questions");

    const interview = await interviewsCol.findOne({ title: "Senior Fronted" });
    if (!interview) {
        console.error("❌ Interview not found!");
        process.exit(1);
    }

    const interviewId = interview._id;
    const rounds = interview.rounds;
    const aptitudeRound = rounds.find((r) => r.type === "aptitude");
    const codingRound = rounds.find((r) => r.type === "coding");
    const hrRound = rounds.find((r) => r.type === "hr");

    // ─── APTITUDE: Generate 15 AI questions ──────────────────────
    console.log("🧮 Generating 15 Aptitude questions...");
    try {
        const aptResult = await callGemini(`You are an expert question paper creator. Generate exactly 15 multiple-choice aptitude questions for a job interview.

Cover these topics evenly:
1. Logical Reasoning (3 questions)
2. Quantitative Aptitude (3 questions)  
3. Verbal Ability (3 questions)
4. Data Interpretation (3 questions)
5. Pattern Recognition (3 questions)

Difficulty: Mix of Easy and Medium.

For EACH question, provide this exact JSON structure:
{
  "title": "Short Title (2-4 words)",
  "description": "The full question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctOption": 0,
  "difficulty": "Easy",
  "tags": ["topic-tag"]
}

Where correctOption is the 0-based index (0=first option, 1=second, etc).

Return a JSON array of exactly 15 objects. No markdown, no explanation, just the array.`);

        if (Array.isArray(aptResult) && aptResult.length > 0) {
            const docs = aptResult.map((q, i) => ({
                interviewId,
                roundId: aptitudeRound._id.toString(),
                type: "aptitude",
                title: q.title || `Aptitude Q${i + 6}`,
                description: q.description || q.question || "",
                difficulty: q.difficulty || "Medium",
                options: q.options || [],
                correctOption: typeof q.correctOption === "number" ? q.correctOption : 0,
                tags: q.tags || [],
                points: 5,
                order: i + 6,
                isAIGenerated: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            }));
            await questionsCol.insertMany(docs);
            console.log(`  ✅ ${docs.length} aptitude questions added`);
        } else {
            console.log("  ⚠️  Got empty result, skipping");
        }
    } catch (err) {
        console.error("  ❌ Failed:", err.message);
    }

    // ─── CODING: Generate 2 AI questions ─────────────────────────
    console.log("\n💻 Generating 2 Coding questions...");
    try {
        const codResult = await callGemini(`You are an expert coding interview question creator. Generate exactly 2 coding challenges for a Full Stack Developer interview.

Topics: JavaScript/React, Node.js, Data Structures.
Difficulty: Medium.

For EACH question, provide this exact JSON structure:
{
  "title": "Short Title",
  "description": "Detailed problem description with examples and constraints. Use markdown formatting.",
  "difficulty": "Medium",
  "functionName": "functionName",
  "tags": ["tag1", "tag2"],
  "starterCode": {
    "javascript": "function template here"
  }
}

Return a JSON array of exactly 2 objects. No markdown fences around the JSON, no explanation.`);

        if (Array.isArray(codResult) && codResult.length > 0) {
            const docs = codResult.map((q, i) => ({
                interviewId,
                roundId: codingRound._id.toString(),
                type: "coding",
                title: q.title || `Coding Q${i + 4}`,
                description: q.description || "",
                difficulty: q.difficulty || "Medium",
                functionName: q.functionName || "",
                starterCode: q.starterCode || {},
                tags: q.tags || [],
                points: 25,
                order: i + 4,
                isAIGenerated: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            }));
            await questionsCol.insertMany(docs);
            console.log(`  ✅ ${docs.length} coding questions added`);
        }
    } catch (err) {
        console.error("  ❌ Failed:", err.message);
    }

    // ─── HR: Generate 3 AI questions ─────────────────────────────
    console.log("\n🤝 Generating 3 HR questions...");
    try {
        const hrResult = await callGemini(`You are an expert HR interviewer. Generate exactly 3 behavioral interview questions for a Full Stack Developer position.

Topics:
1. Team Collaboration
2. Work-Life Balance
3. Career Goals

Difficulty: Easy.

For EACH question, provide this exact JSON structure:
{
  "title": "Short Title (2-4 words)",
  "description": "The full interview question text",
  "difficulty": "Easy",
  "expectedAnswer": "What a good answer should include (evaluation criteria)",
  "tags": ["tag1"]
}

Return a JSON array of exactly 3 objects. No markdown fences, no explanation.`);

        if (Array.isArray(hrResult) && hrResult.length > 0) {
            const docs = hrResult.map((q, i) => ({
                interviewId,
                roundId: hrRound._id.toString(),
                type: "hr",
                title: q.title || `HR Q${i + 8}`,
                description: q.description || "",
                difficulty: q.difficulty || "Easy",
                expectedAnswer: q.expectedAnswer || "",
                tags: q.tags || [],
                points: 10,
                order: i + 8,
                isAIGenerated: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            }));
            await questionsCol.insertMany(docs);
            console.log(`  ✅ ${docs.length} HR questions added`);
        }
    } catch (err) {
        console.error("  ❌ Failed:", err.message);
    }

    // ─── Summary ─────────────────────────────────────────────────
    const r1 = await questionsCol.countDocuments({ interviewId, roundId: aptitudeRound._id.toString() });
    const r2 = await questionsCol.countDocuments({ interviewId, roundId: codingRound._id.toString() });
    const r3 = await questionsCol.countDocuments({ interviewId, roundId: hrRound._id.toString() });
    const total = r1 + r2 + r3;

    console.log("\n" + "═".repeat(50));
    console.log("📊 FINAL QUESTION COUNT");
    console.log("═".repeat(50));
    console.log(`  🧮 Aptitude: ${r1}/20`);
    console.log(`  💻 Coding:   ${r2}/5`);
    console.log(`  🤝 HR:       ${r3}/10`);
    console.log(`  ────────────────`);
    console.log(`  📋 Total:    ${total}/35`);
    console.log("═".repeat(50));

    await mongoose.disconnect();
    console.log("\n✅ Done!");
}

main().catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
});
