import mongoose, { Document, Model, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: "student" | "recruiter";
  isVerified: boolean;
  company?: string;
  techStack?: string[];
  // ─── Student Stats ────────────────────────────────────────
  xp: number;
  level: number;
  streak: number;
  totalAttempts: number;
  averageScore: number;
  badges: { id: string; name: string; description: string; icon: string; color: string; earnedAt: Date }[];
  // ─── Recruiter Stats ──────────────────────────────────────
  totalInterviews: number;
  activeRoles: number;
  // ─── Preferences ──────────────────────────────────────────
  preferences: {
    theme: "light" | "dark";
    language: string;
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    ui: {
      compactMode: boolean;
      fontSize: "Small" | "Medium" | "Large";
    };
    privacy: {
      profileVisibility: "public" | "private";
      showEmail: boolean;
      showToSearchEngines: boolean;
      dataSharing: boolean;
    };
    security: {
      twoFactorEnabled: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Optional for OAuth
    role: { type: String, enum: ["student", "recruiter"], required: true },
    isVerified: { type: Boolean, default: false },
    company: { type: String },
    techStack: [{ type: String }],
    // ─── Student Stats (all default to zero) ────────────────
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    streak: { type: Number, default: 0 },
    totalAttempts: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    badges: { type: [{ id: String, name: String, description: String, icon: String, color: String, earnedAt: Date }], default: [] },
    // ─── Recruiter Stats ────────────────────────────────────
    totalInterviews: { type: Number, default: 0 },
    activeRoles: { type: Number, default: 0 },
    preferences: {
      theme: { type: String, enum: ["light", "dark"], default: "dark" },
      language: { type: String, default: "English" },
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
      },
      ui: {
        compactMode: { type: Boolean, default: false },
        fontSize: { type: String, enum: ["Small", "Medium", "Large"], default: "Medium" },
      },
      privacy: {
        profileVisibility: { type: String, enum: ["public", "private"], default: "public" },
        showEmail: { type: Boolean, default: false },
        showToSearchEngines: { type: Boolean, default: false },
        dataSharing: { type: Boolean, default: true },
      },
      security: {
        twoFactorEnabled: { type: Boolean, default: false },
      },
    },
  },
  { timestamps: true }
);

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
