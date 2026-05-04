import mongoose, { Document, Model, Schema } from "mongoose";

export interface IRoundScore {
  type: "aptitude" | "coding" | "hr";
  score: number;
}

export interface ISubmission extends Document {
  interviewId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  overallScore: number;
  roundScores: IRoundScore[];
  status: "selected" | "rejected";
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RoundScoreSchema = new Schema<IRoundScore>(
  {
    type: { type: String, enum: ["aptitude", "coding", "hr"], required: true },
    score: { type: Number, required: true },
  },
  { _id: false }
);

const SubmissionSchema = new Schema<ISubmission>(
  {
    interviewId: {
      type: Schema.Types.ObjectId,
      ref: "Interview",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    overallScore: { type: Number, required: true },
    roundScores: { type: [RoundScoreSchema], default: [] },
    status: {
      type: String,
      enum: ["selected", "rejected"],
      required: true,
    },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound index: one submission per user per interview
SubmissionSchema.index({ interviewId: 1, userId: 1 }, { unique: true });

const Submission: Model<ISubmission> =
  mongoose.models.Submission ||
  mongoose.model<ISubmission>("Submission", SubmissionSchema);

export default Submission;
