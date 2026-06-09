import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url)

  // Handle PKCE code flow (fallback)
  const code = searchParams.get('code')
  if (code) {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  // Implicit flow — token is in hash fragment (#access_token=...)
  // Hash fragments are not sent to server, so redirect to a client page
  // that reads the hash and sets the session
  const error = searchParams.get('error')
  if (error) {
    return NextResponse.redirect(`${origin}/auth/login?error=${error}`)
  }

  // For implicit flow, redirect to dashboard
  // The Supabase client will handle the hash fragment automatically
  return NextResponse.redirect(`${origin}/dashboard`)
}
