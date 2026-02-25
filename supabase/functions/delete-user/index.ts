import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// In-memory rate limiting (resets on function cold start)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_MAX = 3
const RATE_LIMIT_WINDOW_MS = 900000 // 15 minutes
const MIN_RESPONSE_TIME_MS = 200 // Constant time response to prevent timing attacks

function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  
  if (entry.count >= RATE_LIMIT_MAX) {
    return false
  }
  
  entry.count++
  return true
}

async function ensureMinResponseTime(startTime: number): Promise<void> {
  const elapsed = Date.now() - startTime
  if (elapsed < MIN_RESPONSE_TIME_MS) {
    await new Promise(resolve => setTimeout(resolve, MIN_RESPONSE_TIME_MS - elapsed))
  }
}

Deno.serve(async (req) => {
  const startTime = Date.now()
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Validate JWT using getClaims
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      await ensureMinResponseTime(startTime)
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await supabaseAdmin.auth.getClaims(token)
    
    if (claimsError || !claimsData?.claims) {
      console.error('JWT validation error:', claimsError)
      await ensureMinResponseTime(startTime)
      return new Response(
        JSON.stringify({ error: 'Invalid JWT' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const callerId = claimsData.claims.sub as string
    const callerEmail = claimsData.claims.email as string

    // Check if caller is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', callerId)
      .eq('role', 'admin')
      .maybeSingle()

    if (roleError || !roleData) {
      console.error('Role check error:', roleError)
      await ensureMinResponseTime(startTime)
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check rate limit for this admin
    const rateLimitKey = `delete-user:${callerId}`
    if (!checkRateLimit(rateLimitKey)) {
      console.warn(`Rate limit exceeded for admin ${callerId}`)
      await ensureMinResponseTime(startTime)
      return new Response(
        JSON.stringify({ error: 'Too many attempts. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get request body
    const { userId, adminPassword } = await req.json()

    if (!userId || !adminPassword) {
      await ensureMinResponseTime(startTime)
      return new Response(
        JSON.stringify({ error: 'User ID and admin password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify admin password by attempting to sign in
    const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: callerEmail,
      password: adminPassword
    })

    if (signInError) {
      console.error('Password verification failed for admin:', callerId)
      await ensureMinResponseTime(startTime)
      return new Response(
        JSON.stringify({ error: 'Invalid admin password' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prevent admin from deleting themselves
    if (userId === callerId) {
      await ensureMinResponseTime(startTime)
      return new Response(
        JSON.stringify({ error: 'Cannot delete your own account' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Delete the user (this will cascade to profiles, user_roles, reading_progress due to foreign keys)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('Delete user error:', deleteError)
      await ensureMinResponseTime(startTime)
      return new Response(
        JSON.stringify({ error: 'Failed to delete user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`User ${userId} deleted by admin ${callerEmail}`)

    await ensureMinResponseTime(startTime)
    return new Response(
      JSON.stringify({ success: true, message: 'User deleted successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    await ensureMinResponseTime(startTime)
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
