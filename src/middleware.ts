import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken, signToken, sessionMaxAgeSeconds } from './lib/auth'

const PUBLIC_API_PREFIXES = ['/api/auth']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isApi = pathname.startsWith('/api/')
  const isPublicApi = PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))
  const isLoginPage = pathname === '/login'

  if (isLoginPage || isPublicApi) return NextResponse.next()

  const token = request.cookies.get('auth_token')?.value
  const payload = token ? await verifyToken(token) : null

  if (!payload) {
    if (isApi) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    const loginUrl = new URL('/login', request.url)
    const res = NextResponse.redirect(loginUrl)
    res.cookies.delete('auth_token')
    return res
  }

  // Sessão deslizante: cada requisição autenticada renova o cookie por mais uma janela
  // (8h padrão, 30d se "lembrar acesso" foi marcado no login) — expira mesmo é por inatividade.
  const lembrar = payload.lembrar ?? false
  const refreshed = await signToken(payload, { lembrarAcesso: lembrar })
  const res = NextResponse.next()
  res.cookies.set('auth_token', refreshed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: sessionMaxAgeSeconds(lembrar),
    path: '/',
  })
  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
}
