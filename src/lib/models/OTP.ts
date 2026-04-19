import mongoose, { Document, Model, Schema } from "mongoose";

export interface IOTP extends Document {
  userId: mongoose.Types.ObjectId;
  email: string;
  otp: string;           // bcrypt hashed
  intent: "setup" | "login";
  attempts: number;
  createdAt: Date;
  expiresAt: Date;
}

const OTPSchema = new Schema<IOTP>({
  userId:    { type: Schema.Types.ObjectId, ref: "User", required: true },
  email:     { type: String, required: true },
  otp:       { type: String, required: true },
  intent:    { type: String, enum: ["setup", "login"], required: true },
  attempts:  { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

// MongoDB TTL — auto-deletes documents after expiresAt
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OTP: Model<IOTP> =
  mongoose.models.OTP || mongoose.model<IOTP>("OTP", OTPSchema);

export default OTP;