import { NextResponse } from 'next/server'
import { getTokenFromRequest, podeAjustarNotas, verifyToken } from '../../../../lib/auth'

export const dynamic = 'force-dynamic'

function resposta(body: object, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'private, no-store, max-age=0',
      Pragma: 'no-cache',
      Vary: 'Cookie',
    },
  })
}

export async function GET(request: Request) {
  try {
    const token = getTokenFromRequest(request)

    if (!token) {
      return resposta({ error: 'Não autenticado' }, 401)
    }

    const payload = await verifyToken(token)

    if (!payload) {
      return resposta({ error: 'Token inválido ou expirado' }, 401)
    }

    return resposta({
      usuario: {
        id: payload.id,
        nome: payload.nome,
        email: payload.email,
        role: payload.role,
        escola_id: payload.escola_id,
        is_dev_master: payload.is_dev_master === true,
        pode_ajustar_notas: podeAjustarNotas(payload),
      },
    })
  } catch (err) {
    console.error('[auth/me]', err)
    return resposta({ error: 'Erro interno do servidor' }, 500)
  }
}
