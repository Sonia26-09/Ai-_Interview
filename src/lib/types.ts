// Core Types for AI Mock Interview Platform

export type UserRole = "recruiter" | "student" | "admin";

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatar?: string;
    createdAt: Date;
}

export interface RecruiterProfile extends User {
    role: "recruiter";
    company: string;
    companyLogo?: string;
    industry: string;
    website?: string;
    totalInterviews: number;
    activeRoles: number;
}

export interface StudentProfile extends User {
    role: "student";
    techStack: TechStack[];
    xp: number;
    level: number;
    streak: number;
    totalAttempts: number;
    averageScore: number;
    badges: Badge[];
}

export type TechStack =
    | "JavaScript"
    | "TypeScript"
    | "Python"
    | "Java"
    | "C++"
    | "React"
    | "Node.js"
    | "Next.js"
    | "Django"
    | "Spring Boot"
    | "MongoDB"
    | "PostgreSQL"
    | "DSA"
    | "System Design"
    | "AI/ML"
    | "DevOps"
    | "AWS"
    | "Docker";

export type Difficulty = "Easy" | "Medium" | "Hard";
export type RoundType = "aptitude" | "coding" | "hr";
export type InterviewStatus = "draft" | "active" | "closed" | "archived";
export type AttemptStatus = "not_started" | "in_progress" | "completed" | "abandoned";

export interface Round {
    id: string;
    type: RoundType;
    title: string;
    duration: number; // in minutes
    difficulty: Difficulty;
    questionCount: number;
    techStack?: TechStack[];
    isRequired: boolean;
    order: number;
}

export interface Interview {
    id: string;
    title: string;
    role: string;
    company: string;
    companyLogo?: string;
    description: string;
    rounds: Round[];
    status: InterviewStatus;
    createdBy: string;
    deadline?: Date;
    applicants: number;
    passingScore: number;
    techStack: TechStack[];
    difficulty: Difficulty;
    antiCheat: boolean;
    createdAt: Date;
}

export interface Question {
    id: string;
    type: RoundType;
    title: string;
    description: string;
    difficulty: Difficulty;
    techStack?: TechStack[];
    options?: string[]; // for MCQ
    correctOption?: number; // for MCQ
    starterCode?: Record<string, string>; // for coding
    testCases?: TestCase[]; // for coding
    functionName?: string; // for coding — e.g. "twoSum", "isValid"
    expectedAnswer?: string; // for HR
    aiHints?: string[];
    tags: string[];
    points: number;
}

export interface TestCase {
    id: string;
    input: string;
    expectedOutput: string;
    isHidden: boolean;
    description?: string;
    // Per-language executable input code for LeetCode-style wrapping
    inputCpp?: string;
    inputJava?: string;
    inputPython?: string;
    inputJs?: string;
    argsCpp?: string;
    argsJava?: string;
    argsPython?: string;
    argsJs?: string;
}

export interface Attempt {
    id: string;
    interviewId: string;
    studentId: string;
    status: AttemptStatus;
    startedAt: Date;
    completedAt?: Date;
    roundResults: RoundResult[];
    totalScore: number;
    percentile?: number;
    aiFeedback?: AIFeedback;
}

export interface RoundResult {
    roundId: string;
    roundType: RoundType;
    score: number;
    maxScore: number;
    timeTaken: number; // seconds
    answers: QuestionAnswer[];
    aiFeedback?: string;
}

export interface QuestionAnswer {
    questionId: string;
    answer: string | number;
    isCorrect?: boolean;
    score: number;
    timeTaken: number;
}

export interface QuestionFeedback {
    questionId: string;
    isCorrect: boolean;
    selectedOption: number | null; // index of selected option (for MCQ)
    correctOption: number;          // index of correct option
    explanation: string;            // why the correct answer is right
    tip: string;                    // quick improvement tip
}

export interface AptitudeResult {
    questions: Question[];
    selected: (number | null)[];
    feedbacks: QuestionFeedback[];
    score: number;
    totalPoints: number;
    timeTaken: number; // seconds
}

export interface CodingQuestionFeedback {
    questionId: string;
    score: number;
    timeComplexity: string;
    spaceComplexity: string;
    didWell: string[];
    improve: string[];
    modelApproach: string;
    edgeCases: string[];
    code: string;
}

export interface CodingResult {
    feedbacks: CodingQuestionFeedback[];
    overallScore: number;
}

export interface HRAnswerFeedback {
    questionId: string;
    question: string;
    answer: string;
    clarity: number;
    starStructure: number;
    specificity: number;
    empathy: number;
    overall: number;
    comment: string;
}

export interface HRResult {
    feedbacks: HRAnswerFeedback[];
    overallScore: number;
    confidenceScore: number;
}

export interface AIFeedback {
    overallScore: number;
    strengths: string[];
    improvements: string[];
    communicationScore?: number;
    confidenceScore?: number;
    technicalScore?: number;
    recommendation: "Strongly Recommend" | "Recommend" | "Maybe" | "Not Recommend";
    detailedReport: string;
    studyPlan: string[];
    topicBreakdown: { topic: string; score: number; trend: "up" | "down" | "stable" }[];
}

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    earnedAt: Date;
}

export interface LeaderboardEntry {
    rank: number;
    student: StudentProfile;
    totalScore: number;
    totalAttempts: number;
    averageScore: number;
    streak: number;
    badges: number;
    change: number; // rank change from last week
}

export interface SkillScore {
    topic: string;
    score: number;
    totalAttempts: number;
    trend: "up" | "down" | "stable";
}

export interface AnalyticsData {
    totalApplicants: number;
    completionRate: number;
    averageScore: number;
    passRate: number;
    topTechStacks: { name: string; count: number }[];
    scoreDistribution: { range: string; count: number }[];
    weeklyApplications: { day: string; count: number }[];
}
