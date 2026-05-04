// Quick test: hit the submission API directly
// Usage: node scratch/test-submission.js <interviewId> <cookie>
const interviewId = process.argv[2] || "test";
const cookie = process.argv[3] || "";

const port = 3000;

async function test() {
    console.log(`Testing POST /api/interviews/${interviewId}/submissions on port ${port}...`);
    
    try {
        const res = await fetch(`http://localhost:${port}/api/interviews/${interviewId}/submissions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(cookie ? { Cookie: `auth-token=${cookie}` } : {}),
            },
            body: JSON.stringify({
                overallScore: 75,
                roundScores: [{ type: "aptitude", score: 75 }],
            }),
        });
        
        console.log("Status:", res.status);
        const data = await res.json();
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Fetch error:", err.message);
        
        // Try port 3001
        console.log(`\nRetrying on port 3001...`);
        try {
            const res = await fetch(`http://localhost:3001/api/interviews/${interviewId}/submissions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(cookie ? { Cookie: `auth-token=${cookie}` } : {}),
                },
                body: JSON.stringify({
                    overallScore: 75,
                    roundScores: [{ type: "aptitude", score: 75 }],
                }),
            });
            console.log("Status:", res.status);
            const data = await res.json();
            console.log("Response:", JSON.stringify(data, null, 2));
        } catch (err2) {
            console.error("Fetch error on 3001:", err2.message);
        }
    }
}

test();
