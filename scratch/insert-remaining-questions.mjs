/**
 * Insert remaining questions directly (no Gemini needed — pre-written high-quality questions).
 * Run: node scratch/insert-remaining-questions.mjs
 */

import mongoose from "mongoose";

const MONGODB_URI = "mongodb://localhost:27017/aimock";

async function main() {
    console.log("🔌 Connecting...");
    await mongoose.connect(MONGODB_URI);

    const db = mongoose.connection.db;
    const interviewsCol = db.collection("interviews");
    const questionsCol = db.collection("questions");

    const interview = await interviewsCol.findOne({ title: "Senior Fronted" });
    if (!interview) { console.error("❌ Not found!"); process.exit(1); }

    const interviewId = interview._id;
    const aptRound = interview.rounds.find((r) => r.type === "aptitude");
    const codRound = interview.rounds.find((r) => r.type === "coding");
    const hrRound = interview.rounds.find((r) => r.type === "hr");

    // ═══════════════════════════════════════════════════════════════
    // 15 AI Aptitude Questions
    // ═══════════════════════════════════════════════════════════════
    console.log("🧮 Adding 15 AI aptitude questions...");

    const aiAptitude = [
        { title: "Number Series", description: "What comes next in the series: 3, 9, 27, 81, ?", options: ["162", "243", "216", "324"], correctOption: 1, difficulty: "Easy", tags: ["series"] },
        { title: "Profit & Loss", description: "A shopkeeper buys an item for ₹500 and sells it for ₹600. What is the profit percentage?", options: ["10%", "15%", "20%", "25%"], correctOption: 2, difficulty: "Easy", tags: ["profit-loss"] },
        { title: "Coding Pattern", description: "If CAT = 24, DOG = 26, then FOX = ?", options: ["36", "42", "45", "48"], correctOption: 2, difficulty: "Medium", tags: ["coding-decoding"] },
        { title: "Time & Distance", description: "Two trains of length 100m and 150m are running in opposite directions at 60 km/h and 40 km/h. How long will they take to cross each other?", options: ["6 sec", "9 sec", "12 sec", "15 sec"], correctOption: 1, difficulty: "Medium", tags: ["time-distance"] },
        { title: "Percentage Change", description: "If the price of an item increases by 20% and then decreases by 20%, what is the net change?", options: ["No change", "4% decrease", "4% increase", "2% decrease"], correctOption: 1, difficulty: "Medium", tags: ["percentage"] },
        { title: "Verbal Analogy", description: "Book : Library :: Painting : ?", options: ["Artist", "Gallery", "Canvas", "Color"], correctOption: 1, difficulty: "Easy", tags: ["verbal"] },
        { title: "Sentence Correction", description: "Choose the grammatically correct sentence:", options: ["He don't know nothing about it.", "He doesn't know anything about it.", "He don't know anything about it.", "He doesn't know nothing about it."], correctOption: 1, difficulty: "Easy", tags: ["verbal"] },
        { title: "Logical Deduction", description: "All roses are flowers. Some flowers are red. Which of the following is definitely true?", options: ["All roses are red", "Some roses are red", "No rose is red", "None of the above can be determined"], correctOption: 3, difficulty: "Medium", tags: ["logic"] },
        { title: "Data Table", description: "A company's revenue was ₹10L in Q1, ₹15L in Q2, ₹12L in Q3, ₹18L in Q4. What is the average quarterly revenue?", options: ["₹12.5L", "₹13.5L", "₹13.75L", "₹14L"], correctOption: 2, difficulty: "Easy", tags: ["data-interpretation"] },
        { title: "Pie Chart Analysis", description: "In a class of 200 students, 30% study Math, 25% study Science, 20% study English, and the rest study Arts. How many students study Arts?", options: ["40", "45", "50", "55"], correctOption: 2, difficulty: "Easy", tags: ["data-interpretation"] },
        { title: "Bar Graph Reading", description: "Sales in 5 months were: Jan=100, Feb=120, Mar=90, Apr=150, May=130. What is the percentage increase from Jan to Apr?", options: ["30%", "40%", "50%", "60%"], correctOption: 2, difficulty: "Medium", tags: ["data-interpretation"] },
        { title: "Pattern Matrix", description: "In a 3×3 grid, each row follows a pattern. Row 1: 2, 4, 8. Row 2: 3, 9, 27. Row 3: 5, 25, ?", options: ["50", "75", "125", "150"], correctOption: 2, difficulty: "Medium", tags: ["pattern"] },
        { title: "Mirror Image", description: "If you look at the word AMBULANCE in a mirror, which letter will appear first (leftmost)?", options: ["A", "E", "C", "N"], correctOption: 1, difficulty: "Easy", tags: ["pattern"] },
        { title: "Clock Angle", description: "What is the angle between the hour and minute hand at 3:30?", options: ["75°", "90°", "105°", "120°"], correctOption: 0, difficulty: "Medium", tags: ["reasoning"] },
        { title: "Simple Interest", description: "Find the simple interest on ₹5000 at 8% per annum for 3 years.", options: ["₹1000", "₹1100", "₹1200", "₹1300"], correctOption: 2, difficulty: "Easy", tags: ["arithmetic"] },
    ];

    const aptDocs = aiAptitude.map((q, i) => ({
        interviewId,
        roundId: aptRound._id.toString(),
        type: "aptitude",
        title: q.title,
        description: q.description,
        difficulty: q.difficulty,
        options: q.options,
        correctOption: q.correctOption,
        tags: q.tags,
        points: 5,
        order: i + 6,
        isAIGenerated: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    }));
    await questionsCol.insertMany(aptDocs);
    console.log("  ✅ 15 aptitude questions added");

    // ═══════════════════════════════════════════════════════════════
    // 2 AI Coding Questions
    // ═══════════════════════════════════════════════════════════════
    console.log("💻 Adding 2 AI coding questions...");

    const aiCoding = [
        {
            title: "Find Duplicates in Array",
            description: `Given an array of integers, return an array of elements that appear more than once.

**Example:**
\`\`\`
Input: [1, 2, 3, 2, 4, 3, 5]
Output: [2, 3]
\`\`\`

**Constraints:**
- Return duplicates in the order of their first duplicate occurrence
- Each duplicate should appear only once in the output
- Time complexity should be O(n)`,
            difficulty: "Medium",
            functionName: "findDuplicates",
            starterCode: { javascript: `/**\n * @param {number[]} nums\n * @return {number[]}\n */\nfunction findDuplicates(nums) {\n  // Write your solution here\n  \n}` },
            tags: ["arrays", "hash-map"],
        },
        {
            title: "Debounce Function",
            description: `Implement a debounce function in JavaScript that delays invoking a callback until after a specified wait time has elapsed since the last time the debounced function was called.

**Requirements:**
- The debounced function should cancel previous pending calls
- It should pass through arguments to the original function
- It should maintain proper \`this\` context

**Example Usage:**
\`\`\`javascript
const log = debounce((msg) => console.log(msg), 300);
log("hello"); // cancelled
log("world"); // only this one fires after 300ms
\`\`\``,
            difficulty: "Medium",
            functionName: "debounce",
            starterCode: { javascript: `/**\n * @param {Function} fn\n * @param {number} delay\n * @return {Function}\n */\nfunction debounce(fn, delay) {\n  // Write your solution here\n  \n}` },
            tags: ["javascript", "closures", "async"],
        },
    ];

    const codDocs = aiCoding.map((q, i) => ({
        interviewId,
        roundId: codRound._id.toString(),
        type: "coding",
        title: q.title,
        description: q.description,
        difficulty: q.difficulty,
        functionName: q.functionName,
        starterCode: q.starterCode,
        tags: q.tags,
        points: 25,
        order: i + 4,
        isAIGenerated: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    }));
    await questionsCol.insertMany(codDocs);
    console.log("  ✅ 2 coding questions added");

    // ═══════════════════════════════════════════════════════════════
    // 3 AI HR Questions
    // ═══════════════════════════════════════════════════════════════
    console.log("🤝 Adding 3 AI HR questions...");

    const aiHR = [
        {
            title: "Team Collaboration",
            description: "Describe a project where you had to collaborate closely with designers, backend developers, and product managers. How did you ensure effective communication across teams?",
            difficulty: "Easy",
            expectedAnswer: "Looking for: specific project example, communication tools used (Slack, Jira, standups), conflict resolution, active listening, respecting different perspectives, delivering results together.",
            tags: ["teamwork", "collaboration"],
        },
        {
            title: "Work-Life Balance",
            description: "How do you manage your work-life balance, especially during tight deadlines or production incidents? Can you share a specific example?",
            difficulty: "Easy",
            expectedAnswer: "Looking for: healthy boundaries, time management strategies, prioritization skills, ability to handle pressure without burnout, self-care practices, communicating limits professionally.",
            tags: ["work-life-balance", "stress-management"],
        },
        {
            title: "Learning & Growth",
            description: "Technology changes rapidly. How do you stay updated with new frameworks, tools, and best practices? What is the last new technology you learned and how did you apply it?",
            difficulty: "Easy",
            expectedAnswer: "Looking for: continuous learning mindset, specific resources (blogs, courses, conferences), practical application of new knowledge, willingness to experiment, sharing knowledge with team.",
            tags: ["career-goals", "learning"],
        },
    ];

    const hrDocs = aiHR.map((q, i) => ({
        interviewId,
        roundId: hrRound._id.toString(),
        type: "hr",
        title: q.title,
        description: q.description,
        difficulty: q.difficulty,
        expectedAnswer: q.expectedAnswer,
        tags: q.tags,
        points: 10,
        order: i + 8,
        isAIGenerated: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    }));
    await questionsCol.insertMany(hrDocs);
    console.log("  ✅ 3 HR questions added");

    // ═══════════════════════════════════════════════════════════════
    const r1 = await questionsCol.countDocuments({ interviewId, roundId: aptRound._id.toString() });
    const r2 = await questionsCol.countDocuments({ interviewId, roundId: codRound._id.toString() });
    const r3 = await questionsCol.countDocuments({ interviewId, roundId: hrRound._id.toString() });

    console.log("\n" + "═".repeat(50));
    console.log("📊 FINAL QUESTION COUNT");
    console.log("═".repeat(50));
    console.log(`  🧮 Aptitude: ${r1}/20`);
    console.log(`  💻 Coding:   ${r2}/5`);
    console.log(`  🤝 HR:       ${r3}/10`);
    console.log(`  ────────────────`);
    console.log(`  📋 Total:    ${r1 + r2 + r3}/35`);
    console.log("═".repeat(50));

    await mongoose.disconnect();
    console.log("\n✅ All done!");
}

main().catch((err) => { console.error(err); process.exit(1); });
