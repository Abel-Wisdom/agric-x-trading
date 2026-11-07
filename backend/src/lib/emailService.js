
import { Resend } from "resend";

// VNS 1: INITIALIZE RESEND
const resend = new Resend(process.env.RESEND_API_KEY);

// VNS 2: SEND ADMIN REPLY EMAIL
export const sendReplyEmail = async ({
  recipientEmail,
  subject,
  message,
}) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("Resend API key is not configured.");
    }

    if (!process.env.RESEND_TEST_EMAIL) {
      throw new Error("Resend test email is not configured.");
    }

    // VNS 3: SEND TEST EMAIL TO ADMIN GMAIL
    const result = await resend.emails.send({
      from:
        process.env.RESEND_FROM_EMAIL ||
        "Agric X Trading <onboarding@resend.dev>",
      to: [process.env.RESEND_TEST_EMAIL],
      subject,
      text: `Intended recipient: ${recipientEmail}\n\n${message}`,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data;
  } catch (error) {
    console.error("Resend email error:", error);
    throw error;
  }
};
