import mongoose, { Document, Model, Schema } from "mongoose";

// ─── Round subdocument ───────────────────────────────────────────────
interface IRound {
  type: "aptitude" | "coding" | "hr";
  title: string;
  duration: number;
  difficulty: "Easy" | "Medium" | "Hard";
  questionCount: number;
  techStack?: string[];
  isRequired: boolean;
  order: number;
}

const RoundSchema = new Schema<IRound>(
  {
    type: { type: String, enum: ["aptitude", "coding", "hr"], required: true },
    title: { type: String, required: true },
    duration: { type: Number, required: true },
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], default: "Medium" },
    questionCount: { type: Number, required: true },
    techStack: [{ type: String }],
    isRequired: { type: Boolean, default: true },
    order: { type: Number, required: true },
  },
  { _id: true }
);

// ─── Interview document ──────────────────────────────────────────────
export interface IInterview extends Document {
  title: string;
  role: string;
  description: string;
  rounds: IRound[];
  status: "draft" | "active" | "closed" | "archived";
  createdBy: mongoose.Types.ObjectId;
  deadline?: Date;
  applicants: number;
  passingScore: number;
  techStack: string[];
  difficulty: "Easy" | "Medium" | "Hard";
  antiCheat: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const InterviewSchema = new Schema<IInterview>(
  {
    title: { type: String, required: true, trim: true },
    role: { type: String, default: "", trim: true },
    description: { type: String, default: "" },
    rounds: { type: [RoundSchema], default: [] },
    status: {
      type: String,
      enum: ["draft", "active", "closed", "archived"],
      default: "active",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    deadline: { type: Date },
    applicants: { type: Number, default: 0 },
    passingScore: { type: Number, default: 70 },
    techStack: [{ type: String }],
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
    antiCheat: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Interview: Model<IInterview> =
  mongoose.models.Interview ||
  mongoose.model<IInterview>("Interview", InterviewSchema);

export default Interview;
