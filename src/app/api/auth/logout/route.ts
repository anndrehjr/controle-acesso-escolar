import { NextResponse } from 'next/server'
import { checkApiAuth, getTokenFromRequest, revokeToken } from '../../../../lib/auth'
import { registrarAuditoria } from '../../../../lib/audit'

export async function POST(request: Request) {
  const usuario = await checkApiAuth(request)
  if (usuario) {
    await registrarAuditoria({ usuario, acao: 'LOGOUT', req: request, sucesso: true })
  }

  // Revogação real (F-04): grava o token atual em tokens_revogados até a expiração natural
  // dele — sem isso, um JWT copiado antes do logout continuaria valendo até expirar sozinho.
  const token = getTokenFromRequest(request)
  if (token) {
    await revokeToken(token)
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
