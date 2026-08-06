import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken, signToken, sessionMaxAgeSeconds } from './lib/auth'
export const runtime = 'nodejs'

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

  // Troca de senha obrigatória (F-Final/4): bloqueia qualquer outra coisa até o usuário trocar
  // a senha temporária/redefinida. /api/auth/* já é público (bypass acima) e cobre logout e a
  // própria rota de troca de senha, então este usuário nunca fica preso sem conseguir sair.
  const isTrocarSenhaPage = pathname === '/trocar-senha'
  if (payload.deve_trocar_senha && !isTrocarSenhaPage) {
    if (isApi) {
      return NextResponse.json(
        { error: 'Troca de senha obrigatória antes de continuar', trocarSenhaObrigatoria: true },
        { status: 403 }
      )
    }
    return NextResponse.redirect(new URL('/trocar-senha', request.url))
  }

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
  matcher: ['/dashboard/:path*', '/api/:path*', '/analytics/:path*', '/trocar-senha'],
}
