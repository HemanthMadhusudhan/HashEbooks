import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface BookStatusRequest {
  bookId: string;
  bookTitle: string;
  status: "approved" | "rejected";
  userId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookId, bookTitle, status, userId }: BookStatusRequest = await req.json();

    console.log(`Sending ${status} email for book: ${bookTitle} to user: ${userId}`);

    // Validate required fields
    if (!bookId || !bookTitle || !status || !userId) {
      throw new Error("Missing required fields: bookId, bookTitle, status, userId");
    }

    // Create Supabase client to get user email
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user email from profiles table
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, display_name")
      .eq("id", userId)
      .single();

    if (profileError || !profile?.email) {
      console.error("Error fetching user profile:", profileError);
      throw new Error("Could not find user email");
    }

    const userEmail = profile.email;
    const userName = profile.display_name || "there";

    console.log(`Sending email to: ${userEmail}`);

    const isApproved = status === "approved";
    const subject = isApproved
      ? `🎉 Your book "${bookTitle}" has been approved!`
      : `📚 Update on your book "${bookTitle}"`;

    const htmlContent = isApproved
      ? `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #16a34a;">Great news, ${userName}! 🎉</h1>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Your book <strong>"${bookTitle}"</strong> has been reviewed and approved by our team.
          </p>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            It's now live and available for everyone to read in our library!
          </p>
          <div style="margin: 30px 0; padding: 20px; background: #f0fdf4; border-radius: 8px; border-left: 4px solid #16a34a;">
            <p style="margin: 0; color: #166534;">
              Thank you for contributing to our community. Keep sharing great content!
            </p>
          </div>
          <p style="font-size: 14px; color: #666;">
            Best regards,<br/>
            The HasheBooks Team
          </p>
        </div>
      `
      : `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #dc2626;">Update on your submission</h1>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Hi ${userName},
          </p>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Unfortunately, your book <strong>"${bookTitle}"</strong> was not approved after review.
          </p>
          <div style="margin: 30px 0; padding: 20px; background: #fef2f2; border-radius: 8px; border-left: 4px solid #dc2626;">
            <p style="margin: 0; color: #991b1b;">
              This could be due to content guidelines, formatting issues, or other quality concerns.
            </p>
          </div>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            You're welcome to make changes and resubmit your book for another review.
          </p>
          <p style="font-size: 14px; color: #666;">
            Best regards,<br/>
            The HasheBooks Team
          </p>
        </div>
      `;

    const emailResponse = await resend.emails.send({
      from: "HasheBooks <onboarding@resend.dev>",
      to: [userEmail],
      subject: subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-book-status-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
