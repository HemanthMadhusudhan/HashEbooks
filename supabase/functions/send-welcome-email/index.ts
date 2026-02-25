import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  displayName?: string;
}

// In-memory rate limiting (resets on function cold start)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 3600000; // 1 hour
const MIN_RESPONSE_TIME_MS = 200; // Constant time response to prevent timing attacks

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  entry.count++;
  return true;
}

async function ensureMinResponseTime(startTime: number): Promise<void> {
  const elapsed = Date.now() - startTime;
  if (elapsed < MIN_RESPONSE_TIME_MS) {
    await new Promise(resolve => setTimeout(resolve, MIN_RESPONSE_TIME_MS - elapsed));
  }
}

Deno.serve(async (req: Request): Promise<Response> => {
  const startTime = Date.now();

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Validate JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      await ensureMinResponseTime(startTime);
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAdmin.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error('JWT validation error:', claimsError);
      await ensureMinResponseTime(startTime);
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub as string;
    const userEmail = claimsData.claims.email as string;

    // Parse request body
    const { email, displayName }: WelcomeEmailRequest = await req.json();

    // Validate that email in request matches authenticated user's email
    // This prevents users from sending welcome emails to arbitrary addresses
    if (!email || email.toLowerCase() !== userEmail?.toLowerCase()) {
      console.warn(`Email mismatch attempt: requested ${email}, authenticated as ${userEmail}`);
      await ensureMinResponseTime(startTime);
      return new Response(
        JSON.stringify({ error: 'Email mismatch' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit for this user
    const rateLimitKey = `welcome-email:${userId}`;
    if (!checkRateLimit(rateLimitKey)) {
      console.warn(`Rate limit exceeded for user ${userId}`);
      await ensureMinResponseTime(startTime);
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Sending welcome email to: ${email} (user: ${userId})`);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "HashEBooks <onboarding@resend.dev>",
        to: [email],
        subject: "Welcome to HashEBooks!",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1a365d; margin-bottom: 10px;">📚 HashEBooks</h1>
            </div>
            
            <div style="background-color: #f7fafc; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
              <h2 style="color: #2d3748; margin-top: 0;">Welcome${displayName ? `, ${displayName}` : ''}!</h2>
              <p style="color: #4a5568; font-size: 16px;">
                Thank you for signing up in HashEBooks.
              </p>
              <p style="color: #4a5568; font-size: 16px;">
                You can now upload, share, and read books for free. We're excited to have you as part of our reading community!
              </p>
            </div>
            
            <div style="text-align: center; color: #718096; font-size: 14px; margin-top: 30px;">
              <p style="margin-bottom: 5px;">Regards,</p>
              <p style="font-weight: bold; color: #2d3748;">ADMIN</p>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Resend API error:", data);
      throw new Error(data.message || "Failed to send email");
    }

    console.log("Email sent successfully:", data);

    await ensureMinResponseTime(startTime);
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: unknown) {
    console.error("Error in send-welcome-email function:", error);
    await ensureMinResponseTime(startTime);
    return new Response(
      JSON.stringify({ error: 'An error occurred while sending the email' }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
