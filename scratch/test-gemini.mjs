/**
 * Debug: test Gemini API connectivity
 */
const GEMINI_API_KEY = "AIzaSyA1ATzUqQ7Ch0xl_ertIGneMA-lWYqdUeU";

async function test() {
    console.log("Testing Gemini API...");
    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Generate 2 simple math MCQ questions. Return as JSON array with fields: title, description, options (array of 4), correctOption (0-based index). Only JSON, no markdown." }] }],
            }),
        }
    );
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Full response:", JSON.stringify(data, null, 2).slice(0, 2000));
}

test();
