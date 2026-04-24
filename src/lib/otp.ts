import jwt from "jsonwebtoken";
import crypto from "crypto";

const OTP_SECRET = process.env.OTP_SECRET || process.env.JWT_SECRET || "aimock_otp_fallback_secret";
const OTP_EXPIRY = parseInt(process.env.OTP_EXPIRY_MINUTES || "10") * 60; // seconds

/**
 * Generate a cryptographically secure 6-digit OTP.
 */
export function generateOTP(): string {
    return crypto.randomInt(100000, 999999).toString();
}

/**
 * Create a signed JWT containing the OTP + email + intent.
 * The token itself acts as server-side state — no DB needed.
 */
export function createOTPToken(
    email: string,
    otp: string,
    type: "verify" | "reset"
): string {
    return jwt.sign(
        { email, otp, type },
        OTP_SECRET,
        { expiresIn: OTP_EXPIRY }
    );
}

/**
 * Verify an OTP token and validate the provided OTP matches.
 */
export function verifyOTPToken(
    token: string,
    otp: string,
    type: "verify" | "reset"
): { valid: boolean; email?: string; error?: string } {
    try {
        const decoded = jwt.verify(token, OTP_SECRET) as {
            email: string;
            otp: string;
            type: string;
        };

        if (decoded.type !== type) {
            return { valid: false, error: "Invalid token type" };
        }

        if (decoded.otp !== otp) {
            return { valid: false, error: "Incorrect OTP. Please check and try again." };
        }

        return { valid: true, email: decoded.email };
    } catch (err: any) {
        if (err.name === "TokenExpiredError") {
            return { valid: false, error: "OTP has expired. Please request a new one." };
        }
        return { valid: false, error: "Invalid or expired OTP" };
    }
}
