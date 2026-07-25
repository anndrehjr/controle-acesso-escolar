import db from './db'
import type { JWTPayload } from './auth'

export interface RegistrarAuditoriaInput {
  usuario?: JWTPayload | null
  /** Usado quando ainda não há usuário autenticado (ex: falha de login) */
  usuarioEmailTentativa?: string
  acao: string
  tela?: string
  req?: Request
  dadosAnteriores?: unknown
  dadosNovos?: unknown
  sucesso?: boolean
}

function ipDe(req?: Request): string | null {
  if (!req) return null
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    null
  )
}

/**
 * Grava uma linha em logs_acesso. Nunca lança — auditoria não pode derrubar a requisição
 * principal; falha de log é reportada só no console do servidor.
 */
export async function registrarAuditoria(input: RegistrarAuditoriaInput): Promise<void> {
  try {
    await db`
      INSERT INTO logs_acesso (
        usuario_id, usuario_email, role, escola_id, acao, tela,
        ip, user_agent, dados_anteriores, dados_novos, sucesso
      ) VALUES (
        ${input.usuario?.id ?? null},
        ${input.usuario?.email ?? input.usuarioEmailTentativa ?? null},
        ${input.usuario?.role ?? null},
        ${input.usuario?.escola_id ?? null},
        ${input.acao},
        ${input.tela ?? null},
        ${ipDe(input.req)},
        ${input.req?.headers.get('user-agent') ?? null},
        ${input.dadosAnteriores ? JSON.stringify(input.dadosAnteriores) : null},
        ${input.dadosNovos ? JSON.stringify(input.dadosNovos) : null},
        ${input.sucesso ?? true}
      )
    `
  } catch (err) {
    console.error('[auditoria] falha ao registrar log:', err)
  }
}
