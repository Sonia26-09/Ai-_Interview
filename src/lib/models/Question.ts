import mongoose, { Document, Model, Schema } from "mongoose";

// ─── Question document ──────────────────────────────────────────────
export interface IQuestion extends Document {
  interviewId: mongoose.Types.ObjectId;
  roundId: string; // matches the round's _id in the Interview.rounds array
  type: "aptitude" | "coding" | "hr";
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  techStack?: string[];
  // MCQ (aptitude)
  options?: string[];
  correctOption?: number; // 0-indexed
  // Coding
  starterCode?: Record<string, string>;
  functionName?: string;
  testCases?: {
    input: string;
    expectedOutput: string;
    isHidden: boolean;
    description?: string;
  }[];
  // HR
  expectedAnswer?: string;
  // Meta
  aiHints?: string[];
  tags: string[];
  points: number;
  order: number; // display order within the round
  isAIGenerated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    interviewId: {
      type: Schema.Types.ObjectId,
      ref: "Interview",
      required: true,
      index: true,
    },
    roundId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ["aptitude", "coding", "hr"],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
    techStack: [{ type: String }],
    // MCQ
    options: [{ type: String }],
    correctOption: { type: Number },
    // Coding
    starterCode: { type: Schema.Types.Mixed },
    functionName: { type: String },
    testCases: [
      {
        input: String,
        expectedOutput: String,
        isHidden: { type: Boolean, default: false },
        description: String,
      },
    ],
    // HR
    expectedAnswer: { type: String },
    // Meta
    aiHints: [{ type: String }],
    tags: [{ type: String }],
    points: { type: Number, default: 10 },
    order: { type: Number, default: 0 },
    isAIGenerated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Compound index for efficient queries
QuestionSchema.index({ interviewId: 1, roundId: 1, order: 1 });

const Question: Model<IQuestion> =
  mongoose.models.Question ||
  mongoose.model<IQuestion>("Question", QuestionSchema);

export default Question;
