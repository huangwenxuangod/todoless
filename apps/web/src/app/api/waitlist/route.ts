import { Resend } from "resend";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not configured");
  return new Resend(key);
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return Response.json({ error: "Invalid email" }, { status: 400 });
    }

    const resend = getResend();

    await resend.emails.send({
      from: "todoless <hello@todoless.app>",
      to: email,
      subject: "Welcome to the todoless waitlist",
      html: `
        <p>Hi there,</p>
        <p>Thank you for your interest in todoless. We will reach out with your beta invite as soon as possible.</p>
        <p>If you have any questions, feel free to reply to this email.</p>
        <p>— The todoless team</p>
      `,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Waitlist error:", error);
    return Response.json({ error: "Failed to join waitlist" }, { status: 500 });
  }
}
