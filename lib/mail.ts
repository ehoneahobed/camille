import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;

/**
 * Sends a transactional email via Resend when configured.
 * In development without RESEND_API_KEY, logs the payload instead.
 */
export async function sendMagicLinkEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  if (!resendApiKey) {
    console.info("[mail] RESEND_API_KEY missing — would send magic link:", params.to);
    return;
  }
  const resend = new Resend(resendApiKey);
  const from = process.env.RESEND_FROM ?? "Camille <onboarding@resend.dev>";
  const { error } = await resend.emails.send({
    from,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });
  if (error) {
    throw new Error(error.message);
  }
}
