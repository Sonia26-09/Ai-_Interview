import {
    Interview,
    StudentProfile,
    RecruiterProfile,
    LeaderboardEntry,
    Attempt,
    SkillScore,
    AnalyticsData,
    Question,
} from "./types";

// ─── Mock Companies ───────────────────────────────────────────────
export const mockRecruiters: RecruiterProfile[] = [
    {
        id: "recruiter-1",
        name: "Sarah Chen",
        email: "sarah@google.com",
        role: "recruiter",
        company: "Google",
        industry: "Technology",
        website: "https://google.com",
        totalInterviews: 48,
        activeRoles: 6,
        createdAt: new Date("2024-01-15"),
    },
    {
        id: "recruiter-2",
        name: "Marcus Johnson",
        email: "marcus@microsoft.com",
        role: "recruiter",
        company: "Microsoft",
        industry: "Technology",
        totalInterviews: 32,
        activeRoles: 4,
        createdAt: new Date("2024-02-01"),
    },
];

// ─── Mock Interviews ───────────────────────────────────────────────
export const mockInterviews: Interview[] = [
    {
        id: "int-001",
        title: "Senior Frontend Engineer",
        role: "Senior Frontend Engineer",
        company: "Google",
        description:
            "Join Google's core team building the next generation of web experiences. We're looking for strong React/TypeScript skills with a passion for performance.",
        rounds: [
            {
                id: "r1",
                type: "aptitude",
                title: "Aptitude & Reasoning",
                duration: 30,
                difficulty: "Medium",
                questionCount: 25,
                isRequired: true,
                order: 1,
            },
            {
                id: "r2",
                type: "coding",
                title: "DSA + JavaScript",
                duration: 60,
                difficulty: "Hard",
                questionCount: 3,
                techStack: ["JavaScript", "DSA"],
                isRequired: true,
                order: 2,
            },
            {
                id: "r3",
                type: "hr",
                title: "Culture Fit & HR",
                duration: 30,
                difficulty: "Medium",
                questionCount: 8,
                isRequired: true,
                order: 3,
            },
        ],
        status: "active",
        createdBy: "recruiter-1",
        deadline: new Date("2026-03-15"),
        applicants: 247,
        passingScore: 70,
        techStack: ["React", "TypeScript", "JavaScript"],
        difficulty: "Hard",
        antiCheat: true,
        createdAt: new Date("2026-01-20"),
    },
    {
        id: "int-002",
        title: "Full Stack Developer",
        role: "Full Stack Developer",
        company: "Microsoft",
        description:
            "Build scalable web applications using React and Node.js. You'll work on Azure-integrated products serving millions of users.",
        rounds: [
            {
                id: "r1",
                type: "aptitude",
                title: "Logical Reasoning",
                duration: 20,
                difficulty: "Easy",
                questionCount: 20,
                isRequired: true,
                order: 1,
            },
            {
                id: "r2",
                type: "coding",
                title: "Full Stack Coding",
                duration: 90,
                difficulty: "Medium",
                questionCount: 4,
                techStack: ["React", "Node.js", "MongoDB"],
                isRequired: true,
                order: 2,
            },
            {
                id: "r3",
                type: "hr",
                title: "Behavioural Interview",
                duration: 30,
                difficulty: "Medium",
                questionCount: 6,
                isRequired: false,
                order: 3,
            },
        ],
        status: "active",
        createdBy: "recruiter-2",
        deadline: new Date("2026-03-01"),
        applicants: 183,
        passingScore: 65,
        techStack: ["React", "Node.js", "MongoDB", "TypeScript"],
        difficulty: "Medium",
        antiCheat: true,
        createdAt: new Date("2026-01-25"),
    },
    {
        id: "int-003",
        title: "ML Engineer",
        role: "Machine Learning Engineer",
        company: "DeepMind",
        description:
            "Work on state-of-the-art AI models. Strong Python, ML fundamentals, and research background required.",
        rounds: [
            {
                id: "r1",
                type: "aptitude",
                title: "Math & Statistics",
                duration: 40,
                difficulty: "Hard",
                questionCount: 30,
                isRequired: true,
                order: 1,
            },
            {
                id: "r2",
                type: "coding",
                title: "Python + ML Algorithms",
                duration: 120,
                difficulty: "Hard",
                questionCount: 3,
                techStack: ["Python", "AI/ML"],
                isRequired: true,
                order: 2,
            },
        ],
        status: "active",
        createdBy: "recruiter-1",
        applicants: 412,
        passingScore: 80,
        techStack: ["Python", "AI/ML"],
        difficulty: "Hard",
        antiCheat: true,
        createdAt: new Date("2026-02-01"),
    },
    {
        id: "int-004",
        title: "Backend Developer — Internship",
        role: "Backend Developer",
        company: "Stripe",
        description: "Internship opportunity for backend engineers. Focus on distributed systems and API design.",
        rounds: [
            {
                id: "r1",
                type: "aptitude",
                title: "Aptitude Test",
                duration: 30,
                difficulty: "Easy",
                questionCount: 20,
                isRequired: true,
                order: 1,
            },
            {
                id: "r2",
                type: "coding",
                title: "DSA Coding",
                duration: 60,
                difficulty: "Medium",
                questionCount: 2,
                techStack: ["DSA", "Java"],
                isRequired: true,
                order: 2,
            },
            {
                id: "r3",
                type: "hr",
                title: "HR Round",
                duration: 20,
                difficulty: "Easy",
                questionCount: 5,
                isRequired: false,
                order: 3,
            },
        ],
        status: "active",
        createdBy: "recruiter-1",
        deadline: new Date("2026-02-28"),
        applicants: 634,
        passingScore: 60,
        techStack: ["Java", "DSA", "System Design"],
        difficulty: "Medium",
        antiCheat: false,
        createdAt: new Date("2026-02-05"),
    },
];

// ─── Mock Students ───────────────────────────────────────────────
export const mockStudents: StudentProfile[] = [
    {
        id: "student-1",
        name: "Arjun Mehta",
        email: "arjun@example.com",
        role: "student",
        techStack: ["JavaScript", "React", "Node.js", "DSA"],
        xp: 8450,
        level: 10,
        streak: 12,
        totalAttempts: 24,
        averageScore: 78,
        badges: [
            { id: "b1", name: "Code Warrior", description: "Completed 10 coding rounds", icon: "⚡", color: "cyan", earnedAt: new Date("2026-01-10") },
            { id: "b2", name: "Streak Master", description: "7-day streak", icon: "🔥", color: "orange", earnedAt: new Date("2026-02-01") },
        ],
        createdAt: new Date("2025-10-01"),
    },
    {
        id: "student-2",
        name: "Priya Sharma",
        email: "priya@example.com",
        role: "student",
        techStack: ["Python", "AI/ML", "DSA"],
        xp: 12300,
        level: 12,
        streak: 21,
        totalAttempts: 38,
        averageScore: 88,
        badges: [
            { id: "b3", name: "AI Prodigy", description: "Top score in ML round", icon: "🤖", color: "purple", earnedAt: new Date("2026-01-20") },
        ],
        createdAt: new Date("2025-09-15"),
    },
    {
        id: "student-3",
        name: "Rahul Verma",
        email: "rahul@example.com",
        role: "student",
        techStack: ["Java", "Spring Boot", "DSA", "System Design"],
        xp: 6200,
        level: 8,
        streak: 5,
        totalAttempts: 15,
        averageScore: 65,
        badges: [],
        createdAt: new Date("2025-11-01"),
    },
];

// ─── Mock Leaderboard ───────────────────────────────────────────────
export const mockLeaderboard: LeaderboardEntry[] = [
    { rank: 1, student: mockStudents[1], totalScore: 4820, totalAttempts: 38, averageScore: 88, streak: 21, badges: 3, change: 0 },
    { rank: 2, student: mockStudents[0], totalScore: 3950, totalAttempts: 24, averageScore: 78, streak: 12, badges: 2, change: 1 },
    {
        rank: 3,
        student: { ...mockStudents[2], name: "Sneha Patel", averageScore: 84, xp: 9800, streak: 18 },
        totalScore: 3680,
        totalAttempts: 29,
        averageScore: 84,
        streak: 18,
        badges: 2,
        change: -1,
    },
    {
        rank: 4,
        student: { ...mockStudents[2], id: "s4", name: "Karan Singh", averageScore: 76, xp: 7100, streak: 9 },
        totalScore: 3200,
        totalAttempts: 21,
        averageScore: 76,
        streak: 9,
        badges: 1,
        change: 2,
    },
    {
        rank: 5,
        student: { ...mockStudents[2], id: "s5", name: "Divya Nair", averageScore: 72, xp: 5900, streak: 7 },
        totalScore: 2950,
        totalAttempts: 18,
        averageScore: 72,
        streak: 7,
        badges: 1,
        change: -1,
    },
    {
        rank: 6,
        student: { ...mockStudents[2], id: "s6", name: "Aditya Kumar", averageScore: 69, xp: 5100, streak: 3 },
        totalScore: 2700,
        totalAttempts: 16,
        averageScore: 69,
        streak: 3,
        badges: 0,
        change: 0,
    },
    {
        rank: 7,
        student: { ...mockStudents[2], id: "s7", name: "Anjali Gupta", averageScore: 67, xp: 4800, streak: 6 },
        totalScore: 2480,
        totalAttempts: 15,
        averageScore: 67,
        streak: 6,
        badges: 1,
        change: 3,
    },
    {
        rank: 8,
        student: mockStudents[2],
        totalScore: 2200,
        totalAttempts: 15,
        averageScore: 65,
        streak: 5,
        badges: 0,
        change: -2,
    },
];

// ─── Mock Skill Scores ───────────────────────────────────────────────
export const mockSkillScores: SkillScore[] = [
    { topic: "Arrays & Strings", score: 85, totalAttempts: 14, trend: "up" },
    { topic: "Trees & Graphs", score: 62, totalAttempts: 10, trend: "up" },
    { topic: "Dynamic Programming", score: 45, totalAttempts: 8, trend: "stable" },
    { topic: "Linked Lists", score: 78, totalAttempts: 9, trend: "down" },
    { topic: "Sorting & Searching", score: 90, totalAttempts: 12, trend: "up" },
    { topic: "System Design", score: 55, totalAttempts: 5, trend: "up" },
    { topic: "JavaScript/TS", score: 88, totalAttempts: 18, trend: "up" },
    { topic: "React Patterns", score: 80, totalAttempts: 11, trend: "stable" },
    { topic: "APIs & REST", score: 92, totalAttempts: 15, trend: "up" },
    { topic: "Communication", score: 70, totalAttempts: 8, trend: "up" },
    { topic: "Behavioural", score: 65, totalAttempts: 8, trend: "stable" },
    { topic: "Problem Solving", score: 82, totalAttempts: 20, trend: "up" },
];

// ─── Mock Analytics ───────────────────────────────────────────────
export const mockRecruiterAnalytics: AnalyticsData = {
    totalApplicants: 1476,
    completionRate: 72,
    averageScore: 68,
    passRate: 38,
    topTechStacks: [
        { name: "JavaScript", count: 420 },
        { name: "Python", count: 310 },
        { name: "Java", count: 240 },
        { name: "React", count: 190 },
        { name: "Node.js", count: 160 },
    ],
    scoreDistribution: [
        { range: "0-20", count: 45 },
        { range: "20-40", count: 120 },
        { range: "40-60", count: 280 },
        { range: "60-80", count: 480 },
        { range: "80-100", count: 320 },
    ],
    weeklyApplications: [
        { day: "Mon", count: 48 },
        { day: "Tue", count: 72 },
        { day: "Wed", count: 89 },
        { day: "Thu", count: 65 },
        { day: "Fri", count: 93 },
        { day: "Sat", count: 41 },
        { day: "Sun", count: 28 },
    ],
};

// ─── Mock Questions ───────────────────────────────────────────────
export const mockAptitudeQuestions: Question[] = [
    {
        id: "q1",
        type: "aptitude",
        title: "Logical Series",
        description: "What comes next in the series: 2, 6, 12, 20, 30, ?",
        difficulty: "Easy",
        options: ["40", "42", "44", "48"],
        correctOption: 1,
        tags: ["series", "arithmetic"],
        points: 4,
    },
    {
        id: "q2",
        type: "aptitude",
        title: "Time & Work",
        description: "A can finish work in 18 days and B can do the same work in half the time taken by A. Then if they work together, what part of the work will they do in a day?",
        difficulty: "Medium",
        options: ["1/6", "2/6", "3/6", "1/3"],
        correctOption: 0,
        tags: ["time-work"],
        points: 6,
    },
    {
        id: "q3",
        type: "aptitude",
        title: "Data Interpretation",
        description: "In a company, 60% of employees are male. If 240 employees are female, how many employees are there in total?",
        difficulty: "Easy",
        options: ["400", "480", "500", "600"],
        correctOption: 3,
        tags: ["percentage"],
        points: 4,
    },
    {
        id: "q4",
        type: "aptitude",
        title: "Probability",
        description: "Two dice are thrown simultaneously. What is the probability of getting a sum greater than 10?",
        difficulty: "Hard",
        options: ["1/12", "1/9", "1/6", "3/36"],
        correctOption: 0,
        tags: ["probability"],
        points: 8,
    },
    {
        id: "q5",
        type: "aptitude",
        title: "Coding Pattern",
        description: "If APPLE is coded as 5 and MANGO is coded as 5, what is ORANGE coded as?",
        difficulty: "Easy",
        options: ["5", "6", "4", "7"],
        correctOption: 1,
        tags: ["coding", "pattern"],
        points: 4,
    },
];

export const mockCodingQuestions: Question[] = [
    {
        id: "cq1",
        type: "coding",
        title: "Two Sum",
        functionName: "twoSum",
        description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

**Example:**
\`\`\`
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
\`\`\`

**Constraints:**
- 2 ≤ nums.length ≤ 10⁴
- -10⁹ ≤ nums[i] ≤ 10⁹
- Only one valid answer exists.`,
        difficulty: "Easy",
        techStack: ["DSA", "JavaScript"],
        starterCode: {
            javascript: `/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nfunction twoSum(nums, target) {\n  // Write your solution here\n  \n};`,
            python: `class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        # Write your solution here\n        pass`,
            c: `/**\n * Note: The returned array must be malloced, assume caller calls free().\n */\nint* twoSum(int* nums, int numsSize, int target, int* returnSize) {\n    // Write your solution here\n    \n}`,
            cpp: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your solution here\n        \n    }\n};`
        },
        testCases: [
            {
                id: "tc1", input: "[2,7,11,15], 9", expectedOutput: "[0,1]", isHidden: false, description: "Basic case",
                inputCpp: "vector<int> nums = {2,7,11,15};\nint target = 9;",
                inputJava: "int[] nums = {2,7,11,15};\nint target = 9;",
                inputPython: "nums = [2,7,11,15]\n        target = 9",
                inputJs: "const nums = [2,7,11,15];\nconst target = 9;",
                argsCpp: "nums, target", argsJava: "nums, target", argsPython: "nums, target", argsJs: "nums, target",
            },
            {
                id: "tc2", input: "[3,2,4], 6", expectedOutput: "[1,2]", isHidden: false, description: "Different indices",
                inputCpp: "vector<int> nums = {3,2,4};\nint target = 6;",
                inputJava: "int[] nums = {3,2,4};\nint target = 6;",
                inputPython: "nums = [3,2,4]\n        target = 6",
                inputJs: "const nums = [3,2,4];\nconst target = 6;",
                argsCpp: "nums, target", argsJava: "nums, target", argsPython: "nums, target", argsJs: "nums, target",
            },
            {
                id: "tc3", input: "[3,3], 6", expectedOutput: "[0,1]", isHidden: true, description: "Hidden: duplicate values",
                inputCpp: "vector<int> nums = {3,3};\nint target = 6;",
                inputJava: "int[] nums = {3,3};\nint target = 6;",
                inputPython: "nums = [3,3]\n        target = 6",
                inputJs: "const nums = [3,3];\nconst target = 6;",
                argsCpp: "nums, target", argsJava: "nums, target", argsPython: "nums, target", argsJs: "nums, target",
            },
        ],
        aiHints: [
            "Consider using a hash map to store visited elements",
            "For each element, check if target - element exists in the map",
            "This approach gives O(n) time complexity",
        ],
        tags: ["arrays", "hash-map", "two-pointers"],
        points: 20,
    },
    {
        id: "cq2",
        type: "coding",
        title: "Valid Parentheses",
        functionName: "isValid",
        description: `Given a string \`s\` containing just the characters \`'\('\`, \`'\)'\`, \`'\{'\`, \`'\}'\`, \`'\['\` and \`'\]'\`, determine if the input string is valid.

An input string is valid if:
- Open brackets must be closed by the same type of brackets.
- Open brackets must be closed in the correct order.
- Every close bracket has a corresponding open bracket of the same type.

**Example:**
\`\`\`
Input: s = "()[]{}"
Output: true

Input: s = "(]"
Output: false
\`\`\``,
        difficulty: "Easy",
        techStack: ["DSA"],
        starterCode: {
            javascript: `/**\n * @param {string} s\n * @return {boolean}\n */\nfunction isValid(s) {\n  // Write your solution here\n  \n};`,
            python: `class Solution:\n    def isValid(self, s: str) -> bool:\n        # Write your solution here\n        pass`,
            c: `bool isValid(char * s) {\n    // Write your solution here\n    \n}`,
            cpp: `class Solution {\npublic:\n    bool isValid(string s) {\n        // Write your solution here\n        \n    }\n};`
        },
        testCases: [
            {
                id: "tc1", input: '"()[]{}"', expectedOutput: "true", isHidden: false,
                inputCpp: 'string s = "()[]{}";',
                inputJava: 'String s = "()[]{}";',
                inputPython: 's = "()[]{}"',
                inputJs: 'const s = "()[]{}";',
                argsCpp: "s", argsJava: "s", argsPython: "s", argsJs: "s",
            },
            {
                id: "tc2", input: '"(]"', expectedOutput: "false", isHidden: false,
                inputCpp: 'string s = "(]";',
                inputJava: 'String s = "(]";',
                inputPython: 's = "(]"',
                inputJs: 'const s = "(]";',
                argsCpp: "s", argsJava: "s", argsPython: "s", argsJs: "s",
            },
            {
                id: "tc3", input: '"([)]"', expectedOutput: "false", isHidden: true,
                inputCpp: 'string s = "([)]";',
                inputJava: 'String s = "([)]";',
                inputPython: 's = "([)]"',
                inputJs: 'const s = "([)]";',
                argsCpp: "s", argsJava: "s", argsPython: "s", argsJs: "s",
            },
        ],
        aiHints: ["Stack is perfect for matching brackets", "Push open brackets, pop when closing"],
        tags: ["stack", "strings"],
        points: 20,
    },
    {
        id: "cq3",
        type: "coding",
        title: "LRU Cache",
        description: `Design a data structure that follows the constraints of a **Least Recently Used (LRU) cache**.

Implement the \`LRUCache\` class:
- \`LRUCache(int capacity)\` Initialize the LRU cache with positive size capacity.
- \`int get(int key)\` Return the value of the key if exists, otherwise return \`-1\`.
- \`void put(int key, int value)\` Update or insert the value. If the number of keys exceeds capacity, evict the LRU key.

Both \`get\` and \`put\` must run in **O(1)** average time complexity.`,
        difficulty: "Hard",
        techStack: ["DSA"],
        starterCode: {
            javascript: `class LRUCache {
  /**
   * @param {number} capacity
   */
  constructor(capacity) {
    // Initialize your data structures
  }
  
  /**
   * @param {number} key
   * @return {number}
   */
  get(key) {
    // Return value or -1
  }
  
  /**
   * @param {number} key
   * @param {number} value
   * @return {void}
   */
  put(key, value) {
    // Insert or update
  }
}`,
            python: `class LRUCache:

    def __init__(self, capacity: int):
        # Initialize your data structures
        pass

    def get(self, key: int) -> int:
        pass

    def put(self, key: int, value: int) -> None:
        pass`,
            c: `typedef struct {
    // Define your properties
} LRUCache;

LRUCache* lRUCacheCreate(int capacity) {
    
}

int lRUCacheGet(LRUCache* obj, int key) {
    
}

void lRUCachePut(LRUCache* obj, int key, int value) {
    
}

void lRUCacheFree(LRUCache* obj) {
    
}`,
            cpp: `class LRUCache {
public:
    LRUCache(int capacity) {
        
    }
    
    int get(int key) {
        
    }
    
    void put(int key, int value) {
        
    }
};`
        },
        testCases: [
            {
                id: "tc1",
                input: 'capacity=2, [put(1,1),put(2,2),get(1),put(3,3),get(2),put(4,4),get(1),get(3),get(4)]',
                expectedOutput: "[1,-1,-1,3,4]",
                isHidden: false,
            },
        ],
        aiHints: [
            "Use a doubly linked list + hash map for O(1) operations",
            "The hash map stores key → node references",
            "The doubly linked list maintains access order (MRU at head, LRU at tail)",
        ],
        tags: ["design", "hash-map", "linked-list"],
        points: 30,
    },
];

export const mockHRQuestions: Question[] = [
    {
        id: "hr1",
        type: "hr",
        title: "Strength & Weakness",
        description: "Tell me about your greatest strength and how it has helped you professionally. Also mention one area you're actively working to improve.",
        difficulty: "Easy",
        tags: ["self-awareness", "growth"],
        points: 10,
    },
    {
        id: "hr2",
        type: "hr",
        title: "Conflict Resolution",
        description: "Describe a time when you had a conflict with a team member. How did you handle the situation, and what was the outcome?",
        difficulty: "Medium",
        tags: ["teamwork", "communication", "conflict"],
        points: 15,
    },
    {
        id: "hr3",
        type: "hr",
        title: "Leadership Under Pressure",
        description: "Tell me about a time you had to lead a team through a challenging or high-pressure situation. What steps did you take?",
        difficulty: "Hard",
        tags: ["leadership", "pressure", "decision-making"],
        points: 20,
    },
];

// ─── Practice Interview Templates ───────────────────────────────────────────────
export const practiceTemplates = [
    {
        id: "pt-1",
        title: "Frontend Developer Interview",
        company: "Top Tech Companies",
        difficulty: "Medium" as const,
        duration: 90,
        techStack: ["React", "JavaScript", "TypeScript"],
        rounds: 3,
        rating: 4.8,
        attempts: 12400,
        description: "Comprehensive frontend interview covering React, JavaScript ES6+, CSS, and web performance.",
        color: "cyan",
    },
    {
        id: "pt-2",
        title: "DSA Interview Prep",
        company: "FAANG Level",
        difficulty: "Hard" as const,
        duration: 120,
        techStack: ["DSA", "JavaScript", "Python"],
        rounds: 2,
        rating: 4.9,
        attempts: 28600,
        description: "Master data structures and algorithms with curated FAANG-style problems.",
        color: "purple",
    },
    {
        id: "pt-3",
        title: "Python Backend Engineer",
        company: "Startup to Enterprise",
        difficulty: "Medium" as const,
        duration: 90,
        techStack: ["Python", "Django", "PostgreSQL"],
        rounds: 3,
        rating: 4.6,
        attempts: 8900,
        description: "Backend engineering interview with Python, REST APIs, databases, and system design.",
        color: "green",
    },
    {
        id: "pt-4",
        title: "ML/AI Engineer",
        company: "Research Labs & Tech",
        difficulty: "Hard" as const,
        duration: 150,
        techStack: ["Python", "AI/ML"],
        rounds: 2,
        rating: 4.7,
        attempts: 6200,
        description: "End-to-end ML interview: statistics, ML algorithms, coding, and model design.",
        color: "orange",
    },
    {
        id: "pt-5",
        title: "Full Stack Developer",
        company: "Mid-sized Companies",
        difficulty: "Medium" as const,
        duration: 100,
        techStack: ["React", "Node.js", "MongoDB"],
        rounds: 3,
        rating: 4.5,
        attempts: 15800,
        description: "Complete full stack interview covering React, Node.js, databases, and deployment.",
        color: "blue",
    },
    {
        id: "pt-6",
        title: "HR & Behavioural Mastery",
        company: "All Companies",
        difficulty: "Easy" as const,
        duration: 45,
        techStack: [],
        rounds: 1,
        rating: 4.4,
        attempts: 22100,
        description: "Practice STAR method answers for behavioural questions with AI feedback.",
        color: "pink",
    },
];

// ─── Weekly Progress Data ───────────────────────────────────────────────
export const weeklyProgress = [
    { day: "Mon", score: 72, attempts: 2 },
    { day: "Tue", score: 68, attempts: 1 },
    { day: "Wed", score: 80, attempts: 3 },
    { day: "Thu", score: 75, attempts: 2 },
    { day: "Fri", score: 88, attempts: 4 },
    { day: "Sat", score: 82, attempts: 3 },
    { day: "Sun", score: 79, attempts: 2 },
];

export const monthlyProgress = [
    { week: "Week 1", avgScore: 65, attempts: 8 },
    { week: "Week 2", avgScore: 71, attempts: 12 },
    { week: "Week 3", avgScore: 74, attempts: 10 },
    { week: "Week 4", avgScore: 78, attempts: 17 },
];
