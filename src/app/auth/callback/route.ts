import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Return HTML page that redirects after cookies are set
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Redirecting...</title>
</head>
<body>
  <script>window.location.replace('/dashboard')</script>
  <noscript><meta http-equiv="refresh" content="0;url=/dashboard"></noscript>
</body>
</html>`
      return new NextResponse(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      })
    }
  }

  return NextResponse.redirect('https://avira.arranetwork.com/auth/login')
}
