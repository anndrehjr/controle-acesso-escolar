import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import db from '../../../../lib/db'
import { signToken, sessionMaxAgeSeconds } from '../../../../lib/auth'
import { isRole } from '../../../../types/roles'
import { verificarBloqueio, registrarTentativaLogin, ipDaRequisicao } from '../../../../lib/rateLimit'
import { registrarAuditoria } from '../../../../lib/audit'

export async function POST(request: Request) {
  const ip = ipDaRequisicao(request)

  try {
    const body = (await request.json()) as { email?: string; senha?: string; lembrarAcesso?: boolean }
    const { email, senha, lembrarAcesso } = body

    if (!email || !senha) {
      return NextResponse.json({ error: 'E-mail e senha são obrigatórios' }, { status: 400 })
    }

    const bloqueio = await verificarBloqueio(email, ip)
    if (bloqueio.bloqueado) {
      await registrarAuditoria({
        usuarioEmailTentativa: email,
        acao: 'LOGIN_BLOQUEADO',
        req: request,
        sucesso: false,
      })
      return NextResponse.json(
        {
          error: `Muitas tentativas inválidas. Tente novamente em ${bloqueio.minutosParaLiberar} minutos.`,
        },
        { status: 429 }
      )
    }

    const rows = await db`
      SELECT id, nome, email, role, escola_id, senha_hash
      FROM usuarios
      WHERE email = ${email.toLowerCase().trim()} AND ativo = true
      LIMIT 1
    `

    const usuario = rows[0]
    // Mesma mensagem genérica em todos os casos de falha — não revela se o e-mail existe.
    const credenciaisInvalidas = () =>
      NextResponse.json({ error: 'E-mail ou senha inválidos' }, { status: 401 })

    if (!usuario || !usuario.senha_hash || !isRole(usuario.role)) {
      await registrarTentativaLogin(email, ip, false)
      await registrarAuditoria({ usuarioEmailTentativa: email, acao: 'LOGIN_FALHA', req: request, sucesso: false })
      return credenciaisInvalidas()
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash as string)

    if (!senhaValida) {
      await registrarTentativaLogin(email, ip, false)
      await registrarAuditoria({ usuarioEmailTentativa: email, acao: 'LOGIN_FALHA', req: request, sucesso: false })
      return credenciaisInvalidas()
    }

    await registrarTentativaLogin(email, ip, true)

    const payload = {
      id: usuario.id as string,
      email: usuario.email as string,
      role: usuario.role,
      escola_id: usuario.escola_id as string | null,
      nome: usuario.nome as string,
      lembrar: Boolean(lembrarAcesso),
    }

    const token = await signToken(payload, { lembrarAcesso: Boolean(lembrarAcesso) })

    const response = NextResponse.json({
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        escola_id: usuario.escola_id,
      },
    })

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: sessionMaxAgeSeconds(Boolean(lembrarAcesso)),
      path: '/',
    })

    await registrarAuditoria({ usuario: payload, acao: 'LOGIN_SUCESSO', req: request, sucesso: true })

    return response
  } catch (err) {
    console.error('[auth/login]', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
