import { NextResponse } from 'next/server'
import { checkApiAuth } from '../../../../lib/auth'
import { registrarAuditoria } from '../../../../lib/audit'

export async function POST(request: Request) {
  const usuario = await checkApiAuth(request)
  if (usuario) {
    await registrarAuditoria({ usuario, acao: 'LOGOUT', req: request, sucesso: true })
  }

  const response = NextResponse.json({ ok: true })

  response.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })

  return response
}
