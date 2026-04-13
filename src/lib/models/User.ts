import mongoose, { Document, Model, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: "student" | "recruiter";
  company?: string;
  techStack?: string[];
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
    company: { type: String },
    techStack: [{ type: String }],
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
