import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/auth'

export async function middleware(request: NextRequest) {
  if (process.env.AUTH_ENABLED !== 'true') return NextResponse.next()

  const token = request.cookies.get('auth_token')?.value
  const isLoginPage = request.nextUrl.pathname === '/login'
  const isApiAuth = request.nextUrl.pathname.startsWith('/api/auth')

  if (isLoginPage || isApiAuth) return NextResponse.next()

  if (!token || !(await verifyToken(token))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/dashboard/:path*'],
}
