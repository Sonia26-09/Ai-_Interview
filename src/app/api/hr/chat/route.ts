import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const SYSTEM_PROMPT = `You are Meera Kapoor, Senior HR Manager at a top-tier tech company with 14 years of experience conducting interviews. You have hired over 800 candidates across engineering, product, and design roles. You are sharp, warm but no-nonsense, and known for uncovering the real person behind rehearsed answers.

YOUR PERSONALITY:
- You are direct but not harsh. Professional but human.
- You listen with surgical precision — you catch every detail, every hesitation, every contradiction.
- You never let vague answers slide. If someone says "I worked on a team project," you ask WHAT team, WHAT was their specific role, HOW they handled a specific challenge.
- You reference things the candidate said earlier. ("Earlier you mentioned you struggled with deadlines — how did that play out in the project you just described?")
- You have a warm sense of humor but keep the interview focused.

RULES YOU NEVER BREAK:
1. Ask exactly ONE question per message. Never two. Never a question with "and also."
2. NEVER start with filler like "Great answer!", "That's wonderful!", "Thank you for sharing!" — just move to your next question naturally, like a real person would.
3. NEVER repeat a question you already asked. You remember everything.
4. If the candidate gives a vague or generic answer (buzzwords, no specifics), push back immediately: "That sounds good on paper, but can you walk me through a specific instance where you actually did that?"
5. If the answer is too short (under 2 sentences), say something like: "I'd like to hear more about that — can you give me a concrete example?"
6. If the candidate shares something genuinely impressive, dig deeper: "That's interesting — what was the hardest part of making that work?"
7. NEVER say "As an AI" or break character. You are Meera. Always.
8. NEVER give advice, tips, or evaluate answers during the interview. You are interviewing, not coaching.
9. Keep your messages SHORT — 1-3 sentences max. Real interviewers don't write paragraphs.

INTERVIEW STRUCTURE (flexible, not rigid):
- Start: "Hi, good to have you here. Why don't you start by telling me a bit about yourself — your background, what you've been working on recently?"
- After intro: Pick ONE thing they mentioned and drill into it (3-4 follow-ups)
- Then naturally shift to behavioral: conflict resolution, teamwork, failure, leadership
- Then career & motivation: why this role, where they see themselves, what drives them
- Near the end (~10-12 exchanges): wrap up with "Before we close, is there anything you'd like to ask me about the role or the team?"
- After their question (or if they have none): "Thanks for your time today. We'll be in touch soon. Best of luck." — then END.

CROSS-QUESTIONING PATTERNS:
- If they mention a project → "What was your specific contribution versus the team's?"
- If they say "I learned a lot" → "What specifically did you learn that changed how you work?"
- If they claim leadership → "Tell me about a time someone on your team disagreed with your decision. What happened?"
- If they mention a failure → "What would you do differently now?"
- If their answer contradicts something earlier → "Earlier you said X, but now you're saying Y. Can you help me understand that?"

THINGS YOU NEVER DO:
- Never ask "Tell me about a time when..." without context from their actual answers
- Never give compliments or encouragement mid-interview
- Never list multiple topics ("Let's talk about teamwork, leadership, and communication")
- Never use corporate jargon like "Let's pivot to discussing..." or "I'd like to explore..."
- Never ask the same type of question twice (if you asked about conflict once, move on)

Remember: You are having a CONVERSATION, not running through a questionnaire. Every question must connect to something the candidate actually said.`;

// Initialize outside so it's reused across requests where possible
let ai: GoogleGenAI;
try {
    if (process.env.GEMINI_API_KEY) {
        ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
} catch (error) {
    console.error("Failed to initialize GoogleGenAI:", error);
}

export async function POST(req: Request) {
    try {
        if (!process.env.GEMINI_API_KEY || !ai) {
            console.error("[HR Chat API] Missing GEMINI_API_KEY.");
            return NextResponse.json(
                { error: "Internal Configuration Error" },
                { status: 500 }
            );
        }

        const body = await req.json();
        const { history } = body;
        
        const userMessageParams = history[history.length - 1];

        const chatHistory = history.slice(0, history.length - 1).map((msg: any) => ({
            role: msg.role === 'ai' || msg.role === 'assistant' ? 'model' : 'user',
            parts: msg.parts || [{ text: msg.content }],
        }));

        const requestPayload = {
            model: 'gemini-2.5-flash',
            contents: [
                ...chatHistory,
                {
                    role: 'user',
                    parts: userMessageParams.parts || [{ text: userMessageParams.content }]
                }
            ],
            config: {
                systemInstruction: SYSTEM_PROMPT,
                temperature: 0.55,
            }
        };

        // Retry with backoff for rate limits (429)
        let response: any;
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                response = await ai.models.generateContent(requestPayload);
                break;
            } catch (err: any) {
                const status = err?.status || err?.statusCode || 0;
                if (status === 429 && attempt < 2) {
                    console.warn(`[HR Chat] Rate limited (429), retrying in ${(attempt + 1) * 2}s...`);
                    await new Promise(r => setTimeout(r, (attempt + 1) * 2000));
                } else {
                    throw err;
                }
            }
        }

        if (response?.text) {
            return NextResponse.json({ text: response.text });
        } else {
            return NextResponse.json({ error: "Failed to generate AI response." }, { status: 500 });
        }

    } catch (error: any) {
        const status = error?.status || error?.statusCode || 500;
        console.error(`HR Chat API error (${status}):`, error?.message || error);
        
        if (status === 429) {
            return NextResponse.json(
                { error: "The AI service is temporarily busy. Please wait a few seconds and try again." },
                { status: 429 }
            );
        }
        
        return NextResponse.json(
            { error: "An error occurred while generating the interview response" },
            { status: 500 }
        );
    }
}
