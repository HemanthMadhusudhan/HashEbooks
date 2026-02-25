import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") as string;
const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET") as string;

interface AuthEmailPayload {
  user: {
    email: string;
    user_metadata?: {
      display_name?: string;
    };
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
  };
}

const getEmailContent = (
  emailActionType: string,
  token: string,
  displayName?: string
) => {
  const greeting = displayName ? `Hello ${displayName}` : "Hello";

  switch (emailActionType) {
    case "signup":
      return {
        subject: "Verify your HashEBooks account",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #1a365d; margin-bottom: 10px; font-size: 28px;">📚 HashEBooks</h1>
              </div>
              
              <h2 style="color: #2d3748; margin-top: 0; font-size: 20px;">${greeting},</h2>
              <p style="color: #4a5568; font-size: 16px;">
                Thank you for signing up for HashEBooks! Please use the verification code below to complete your registration:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <div style="display: inline-block; background-color: #f0f4f8; border-radius: 8px; padding: 20px 40px; border: 2px dashed #cbd5e0;">
                  <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a365d;">${token}</span>
                </div>
              </div>
              
              <p style="color: #718096; font-size: 14px; text-align: center;">
                This code will expire in 1 hour. If you didn't request this, please ignore this email.
              </p>
              
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
              
              <div style="text-align: center; color: #718096; font-size: 14px;">
                <p style="margin-bottom: 5px;">Regards,</p>
                <p style="font-weight: bold; color: #2d3748;">HashEBooks Support</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case "recovery":
    case "magiclink":
      return {
        subject: "Reset your HashEBooks password",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #1a365d; margin-bottom: 10px; font-size: 28px;">📚 HashEBooks</h1>
              </div>
              
              <h2 style="color: #2d3748; margin-top: 0; font-size: 20px;">${greeting},</h2>
              <p style="color: #4a5568; font-size: 16px;">
                We received a request to reset your password. Use the code below to set a new password:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <div style="display: inline-block; background-color: #f0f4f8; border-radius: 8px; padding: 20px 40px; border: 2px dashed #cbd5e0;">
                  <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a365d;">${token}</span>
                </div>
              </div>
              
              <p style="color: #718096; font-size: 14px; text-align: center;">
                This code will expire in 1 hour. If you didn't request a password reset, please ignore this email.
              </p>
              
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
              
              <div style="text-align: center; color: #718096; font-size: 14px;">
                <p style="margin-bottom: 5px;">Regards,</p>
                <p style="font-weight: bold; color: #2d3748;">HashEBooks Support</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case "email_change":
      return {
        subject: "Confirm your new email for HashEBooks",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #1a365d; margin-bottom: 10px; font-size: 28px;">📚 HashEBooks</h1>
              </div>
              
              <h2 style="color: #2d3748; margin-top: 0; font-size: 20px;">${greeting},</h2>
              <p style="color: #4a5568; font-size: 16px;">
                Please use the code below to confirm your new email address:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <div style="display: inline-block; background-color: #f0f4f8; border-radius: 8px; padding: 20px 40px; border: 2px dashed #cbd5e0;">
                  <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a365d;">${token}</span>
                </div>
              </div>
              
              <p style="color: #718096; font-size: 14px; text-align: center;">
                This code will expire in 1 hour. If you didn't request this change, please contact support immediately.
              </p>
              
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
              
              <div style="text-align: center; color: #718096; font-size: 14px;">
                <p style="margin-bottom: 5px;">Regards,</p>
                <p style="font-weight: bold; color: #2d3748;">HashEBooks Support</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    default:
      return {
        subject: "Your HashEBooks verification code",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #1a365d; margin-bottom: 10px; font-size: 28px;">📚 HashEBooks</h1>
              </div>
              
              <h2 style="color: #2d3748; margin-top: 0; font-size: 20px;">${greeting},</h2>
              <p style="color: #4a5568; font-size: 16px;">
                Here is your verification code:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <div style="display: inline-block; background-color: #f0f4f8; border-radius: 8px; padding: 20px 40px; border: 2px dashed #cbd5e0;">
                  <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a365d;">${token}</span>
                </div>
              </div>
              
              <p style="color: #718096; font-size: 14px; text-align: center;">
                This code will expire in 1 hour.
              </p>
              
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
              
              <div style="text-align: center; color: #718096; font-size: 14px;">
                <p style="margin-bottom: 5px;">Regards,</p>
                <p style="font-weight: bold; color: #2d3748;">HashEBooks Support</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };
  }
};

serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);

  try {
    const wh = new Webhook(hookSecret);
    const { user, email_data } = wh.verify(payload, headers) as AuthEmailPayload;

    console.log(`Sending auth email to: ${user.email}, type: ${email_data.email_action_type}`);

    const displayName = user.user_metadata?.display_name;
    const { subject, html } = getEmailContent(
      email_data.email_action_type,
      email_data.token,
      displayName
    );

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "HashEBooks Support <onboarding@resend.dev>",
        to: [user.email],
        subject,
        html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Resend API error:", data);
      throw new Error(data.message || "Failed to send email");
    }


    console.log("Auth email sent successfully");

    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in send-auth-email function:", error);
    return new Response(
      JSON.stringify({
        error: {
          http_code: error.code || 500,
          message: error.message || "Failed to send email",
        },
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});