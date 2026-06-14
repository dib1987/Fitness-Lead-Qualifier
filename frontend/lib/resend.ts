// Email send + inbound (F12 + F3). Replaces AWS SES. Reply/bounce detection moves
// to Resend inbound webhooks — see app/api/webhooks/email/route.ts.
import { Resend } from "resend";

let _resend: Resend | null = null;
export function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY not configured");
    _resend = new Resend(key);
  }
  return _resend;
}

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "team@example.com";
