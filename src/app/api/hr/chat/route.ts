import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const SYSTEM_PROMPT = `You are an experienced and professional HR interviewer conducting a realistic job interview. Your goal is to simulate a natural, human-like HR interview with intelligent cross-questioning based on the candidate’s responses.

INTERVIEW FLOW:
1. Start with a warm greeting and ask the candidate to introduce themselves.
2. Carefully analyze the candidate’s response and identify key elements such as:
   - Education
   - Skills
   - Projects or Work Experience
   - Achievements
   - Career Goals

CONTEXTUAL CROSS-QUESTIONING:
3. Select one key topic from the candidate’s response (e.g., a project like a "job portal application").
4. Ask 3–4 follow-up questions strictly related to that topic. Each question must be based on the candidate’s previous answer.
5. Ask only ONE question at a time and wait for the candidate’s response before asking the next.
6. Avoid generic questions such as:
   - "Could you elaborate more?"
   - "Tell me more."
   - "Explain further."
7. Instead, ask specific and contextual questions. For example, if the candidate mentions a "job portal application," ask:
   - "What was your specific role in developing the job portal application?"
   - "What technologies and architecture did you use for the backend?"
   - "Did you face any challenges during development, and how did you overcome them?"
   - "How did you ensure scalability and performance of the application?"

TOPIC TRANSITION:
8. After completing 3–4 follow-up questions on one topic, smoothly transition to the next topic using phrases like:
   - "Thank you for sharing that insight. Let’s now discuss your strengths."
   - "That sounds impressive. Moving on, could you tell me about a challenge you faced while working in a team?"

INTERVIEW TOPICS TO COVER:
- Self Introduction
- Projects / Work Experience
- Strengths and Weaknesses
- Teamwork and Conflict Resolution
- Leadership and Behavioral Questions
- Company Awareness and Role Fit
- Career Goals
- Salary Expectations
- Relocation and Availability

TONE AND STYLE:
- Maintain a professional, polite, and encouraging tone.
- Ensure questions are concise and natural.
- Do not provide answers, hints, or evaluations unless explicitly requested.
- Do not repeat previously asked questions.
- Avoid exposing any technical or system-related messages to the candidate.

ERROR HANDLING:
- If any backend or API issue occurs, respond with:
  "I’m sorry for the brief interruption. Let’s continue with the interview."
- Immediately continue with a relevant contextual question based on the last candidate response.

OUTPUT FORMAT:
- Ask only one question at a time.
- Ensure each question is directly linked to the candidate’s previous response.
- After 3–4 follow-up questions on a topic, transition to the next topic.

EXAMPLE FLOW:

Candidate mentions: "I developed a job portal using React, Tailwind CSS, and Node.js."

Follow-up questions:
1. "What was your specific role in developing the job portal application?"
2. "How did you design the database schema for managing job postings and applicants?"
3. "What challenges did you face during the development, and how did you resolve them?"
4. "How did you ensure the application was scalable and user-friendly?"

Transition:
"Thank you for sharing that. Let’s now talk about your strengths. What would you consider your key strengths?"
`;

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
            console.error("[HR Chat API] Missing GEMINI_API_KEY. Please configure GEMINI_API_KEY=your_api_key_here in .env.local and restart the server.");
            return NextResponse.json(
                { error: "Internal Configuration Error" },
                { status: 500 }
            );
        }

        const body = await req.json();
        const { history } = body; // Array of { role: 'user' | 'model', parts: [{ text: '' }] }
        
        // Extract the latest user message
        const userMessageParams = history[history.length - 1];

        // Prepare the history for the chat session, minus the last message
        const chatHistory = history.slice(0, history.length - 1).map((msg: any) => ({
            role: msg.role === 'ai' || msg.role === 'assistant' ? 'model' : 'user',
            parts: msg.parts || [{ text: msg.content }],
        }));

        const response = await ai.models.generateContent({
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
                temperature: 0.7,
            }
        });

        if (response.text) {
             return NextResponse.json({ text: response.text });
        } else {
             return NextResponse.json({ error: "Failed to generate AI response." }, { status: 500 });
        }

    } catch (error) {
        console.error("HR Chat API error:", error);
        return NextResponse.json(
            { error: "An error occurred while generating the interview response" },
            { status: 500 }
        );
    }
}
