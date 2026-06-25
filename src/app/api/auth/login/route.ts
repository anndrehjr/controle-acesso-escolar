import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import db from '../../../../lib/db'
import { signToken } from '../../../../lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: string; senha?: string }
    const { email, senha } = body

    if (!email || !senha) {
      return NextResponse.json({ error: 'Email e senha obrigatórios' }, { status: 400 })
    }

    const rows = await db`
      SELECT id, nome, email, role, escola_id, senha_hash
      FROM usuarios
      WHERE email = ${email} AND ativo = true
      LIMIT 1
    `

    const usuario = rows[0]

    if (!usuario) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
    }

    if (!usuario.senha_hash) {
      return NextResponse.json({ error: 'Senha não configurada para este usuário' }, { status: 401 })
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash as string)

    if (!senhaValida) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
    }

    const token = await signToken({
      id: usuario.id as string,
      email: usuario.email as string,
      role: usuario.role as string,
      escola_id: usuario.escola_id as string | null,
      nome: usuario.nome as string,
    })

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
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/',
    })

    return response
  } catch (err) {
    console.error('[auth/login]', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
