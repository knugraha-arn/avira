import { NextResponse, type NextRequest } from 'next/server'

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
  const cookies = request.cookies.getAll()
  const hasSession = cookies.some(
    c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
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
