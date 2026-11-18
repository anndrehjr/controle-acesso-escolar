import db from './db'
import type { JWTPayload } from './auth'

export interface RegistrarAuditoriaInput {
  usuario?: JWTPayload | null
  /** Usado quando ainda não há usuário autenticado (ex: falha de login). */
  usuarioEmailTentativa?: string
  /** Escola afetada. Necessário para perfis globais, cujo token não possui escola_id. */
  escolaId?: string | null
  acao: string
  tabela?: string
  registroId?: string | null
  tela?: string
  req?: Request
  dadosAnteriores?: unknown
  dadosNovos?: unknown
  sucesso?: boolean
}

export type RegistroAuditoria = {
  usuario_id: string | null
  usuario_email: string | null
  role: string | null
  escola_id: string | null
  acao: string
  tabela: string | null
  registro_id: string | null
  tela: string | null
  ip: string | null
  user_agent: string | null
  dados_anteriores: string | null
  dados_novos: string | null
  sucesso: boolean
}

export function ipDe(req?: Request): string | null {
  if (!req) return null
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? null
}

export function montarRegistroAuditoria(input: RegistrarAuditoriaInput): RegistroAuditoria {
  return {
    usuario_id: input.usuario?.id ?? null,
    usuario_email: input.usuario?.email ?? input.usuarioEmailTentativa ?? null,
    role: input.usuario?.role ?? null,
    escola_id: input.escolaId ?? input.usuario?.escola_id ?? null,
    acao: input.acao,
    tabela: input.tabela ?? null,
    registro_id: input.registroId ?? null,
    tela: input.tela ?? null,
    ip: ipDe(input.req),
    user_agent: input.req?.headers.get('user-agent') ?? null,
    dados_anteriores: input.dadosAnteriores === undefined ? null : JSON.stringify(input.dadosAnteriores),
    dados_novos: input.dadosNovos === undefined ? null : JSON.stringify(input.dadosNovos),
    sucesso: input.sucesso ?? true,
  }
}

/**
 * Auditoria auxiliar para eventos que não fazem parte de uma alteração crítica.
 * Operações críticas devem inserir montarRegistroAuditoria() dentro da mesma transação.
 */
export async function registrarAuditoria(input: RegistrarAuditoriaInput): Promise<void> {
  try {
    const row = montarRegistroAuditoria(input)
    await db`
      INSERT INTO logs_acesso (
        usuario_id, usuario_email, role, escola_id, acao, tabela, registro_id,
        tela, ip, user_agent, dados_anteriores, dados_novos, sucesso
      ) VALUES (
        ${row.usuario_id}, ${row.usuario_email}, ${row.role}, ${row.escola_id},
        ${row.acao}, ${row.tabela}, ${row.registro_id}, ${row.tela}, ${row.ip},
        ${row.user_agent}, ${row.dados_anteriores}, ${row.dados_novos}, ${row.sucesso}
      )
    `
  } catch (err) {
    console.error('[auditoria] falha ao registrar log:', err)
  }
}
