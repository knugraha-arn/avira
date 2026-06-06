import { NextResponse, type NextRequest } from 'next/server'

// Supabase project ID for AVIRA — qlmtwssjcostyddiwszc
const SUPABASE_PROJECT = 'qlmtwssjcostyddiwszc'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip callback and static files
  if (
    pathname.startsWith('/auth/callback') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const isAuthPage = pathname.startsWith('/auth')

  // Check ONLY the AVIRA Supabase project cookie
  const hasSession =
    request.cookies.has(`sb-${SUPABASE_PROJECT}-auth-token`) ||
    request.cookies.has(`sb-${SUPABASE_PROJECT}-auth-token.0`)

  if (!hasSession && !isAuthPage) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (hasSession && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/(.*)'],
}
