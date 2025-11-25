import 'dotenv/config';
import { Resend } from "resend";

// Read and validate API key early
const apiKey = (process.env.RESEND_API_KEY || "").trim();
if (!apiKey) {
  console.error("[EmailService] RESEND_API_KEY missing. Add it to .env (RESEND_API_KEY=re_xxx). Email sending disabled.");
}

// Create client only if key exists (prevents constructor throw)
const resend = apiKey ? new Resend(apiKey) : null;

/**
 * Send verification email
 * Throws a clear error if service not configured.
 */
export const sendVerificationEmail = async (to, code) => {
  if (!resend) {
    throw new Error("Email service unavailable: missing RESEND_API_KEY");
  }

  const from = process.env.EMAIL_FROM || "noreply@cafex.site";
  const subject = "Verify your CafeX account";
  const text = `Your CafeX verification code is: ${code}`;
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
      <div style="text-align:center;margin-bottom:16px">
        <h2 style="margin:0;color:#1f2937">CafeX</h2>
        <p style="margin:4px 0;color:#6b7280">Email Verification</p>
      </div>
      <p style="color:#374151">Use the code below to verify your email. It expires in 15 minutes.</p>
      <div style="text-align:center;margin:20px 0">
        <div style="display:inline-block;padding:12px 18px;border-radius:10px;background:#111827;color:#fff;font-weight:700;letter-spacing:2px;font-size:20px">
          ${code}
        </div>
      </div>
      <p style="color:#6b7280;font-size:12px">If you didn’t request this, you can ignore this email.</p>
    </div>
  `;
  try {
    await resend.emails.send({ from, to, subject, html, text });
    return true;
  } catch (err) {
    console.error("[EmailService] Resend send error:", err?.message || err);
    throw new Error("Failed to send verification email");
  }
};