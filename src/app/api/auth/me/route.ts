import { NextResponse } from 'next/server'
import { getTokenFromRequest, verifyToken } from '../../../../lib/auth'

export async function GET(request: Request) {
  try {
    const token = getTokenFromRequest(request)

    if (!token) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const payload = await verifyToken(token)

    if (!payload) {
      return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 401 })
    }

    return NextResponse.json({
      usuario: {
        id: payload.id,
        nome: payload.nome,
        email: payload.email,
        role: payload.role,
        escola_id: payload.escola_id,
      },
    })
  } catch (err) {
    console.error('[auth/me]', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
