/**
 * One-time script to add 3 rounds to the "Senior Fronted" interview.
 * Run: node scratch/add-rounds.mjs
 */

import mongoose from "mongoose";

const MONGODB_URI = "mongodb://localhost:27017/aimock";

async function main() {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected");

    const db = mongoose.connection.db;
    const collection = db.collection("interviews");

    // Find the "Senior Fronted" interview
    const interview = await collection.findOne({ title: "Senior Fronted" });

    if (!interview) {
        // Try case-insensitive search
        const alt = await collection.findOne({
            title: { $regex: /senior front/i },
        });
        if (!alt) {
            console.error("❌ Interview 'Senior Fronted' not found. Existing interviews:");
            const all = await collection.find({}, { projection: { title: 1, role: 1 } }).toArray();
            all.forEach((i) => console.log(`  - "${i.title}" (role: ${i.role})`));
            await mongoose.disconnect();
            process.exit(1);
        }
        console.log(`Found interview with similar name: "${alt.title}" (id: ${alt._id})`);
        await updateInterview(collection, alt._id);
    } else {
        console.log(`Found interview: "${interview.title}" (id: ${interview._id})`);
        await updateInterview(collection, interview._id);
    }

    await mongoose.disconnect();
    console.log("✅ Done! Disconnected from MongoDB.");
}

async function updateInterview(collection, interviewId) {
    const rounds = [
        {
            _id: new mongoose.Types.ObjectId(),
            type: "aptitude",
            title: "Aptitude Round",
            duration: 30,
            difficulty: "Medium",
            questionCount: 20,
            techStack: [],
            isRequired: true,
            order: 1,
        },
        {
            _id: new mongoose.Types.ObjectId(),
            type: "coding",
            title: "Coding Round",
            duration: 60,
            difficulty: "Medium",
            questionCount: 5,
            techStack: ["JavaScript", "React", "Node.js"],
            isRequired: true,
            order: 2,
        },
        {
            _id: new mongoose.Types.ObjectId(),
            type: "hr",
            title: "HR Round",
            duration: 20,
            difficulty: "Easy",
            questionCount: 10,
            techStack: [],
            isRequired: true,
            order: 3,
        },
    ];

    const result = await collection.updateOne(
        { _id: interviewId },
        {
            $set: {
                rounds: rounds,
                passingScore: 70,
                antiCheat: true,
            },
        }
    );

    if (result.modifiedCount === 1) {
        console.log("✅ Successfully added 3 rounds:");
        console.log("   1. Aptitude Round — 20 questions, 30 min, Medium");
        console.log("   2. Coding Round   — 5 questions, 60 min, Medium");
        console.log("   3. HR Round       — 10 questions, 20 min, Easy");
        console.log("   Total: 35 questions, 110 min, Passing: 70%");
    } else {
        console.error("❌ Update did not modify any documents");
    }
}

main().catch((err) => {
    console.error("Script error:", err);
    process.exit(1);
});
