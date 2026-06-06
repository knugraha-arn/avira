import { NextResponse, type NextRequest } from 'next/server'

const SUPABASE_PROJECT = 'qlmtwssjcostyddiwszc'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/auth/callback') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const isAuthPage = pathname.startsWith('/auth')

  const hasSession = request.cookies.getAll().some(
    c => c.name.startsWith(`sb-${SUPABASE_PROJECT}-auth-token`)
  )

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
