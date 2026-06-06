import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code  = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    console.error('OAuth error:', error, searchParams.get('error_description'))
    return NextResponse.redirect('https://avira.arranetwork.com/auth/login')
  }

  if (code) {
    const supabase = await createClient()
    const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
    console.log('session data:', data, 'error:', sessionError)
    if (!sessionError) {
      return NextResponse.redirect('https://avira.arranetwork.com/dashboard')
    }
    console.error('Session error:', sessionError)
  }

  return NextResponse.redirect('https://avira.arranetwork.com/auth/login')
}
