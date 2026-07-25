import db from './db'
import { capabilitiesFor } from '../types/roles'
import type { JWTPayload } from './auth'

/**
 * Retorna a escola_id que o usuário deve enxergar para uma requisição, ou null se o acesso
 * pedido não for permitido. Uso: sempre que uma rota recebe um escolaId (query/param), validar
 * com esta função antes de consultar o banco — nunca confiar no escolaId do cliente sozinho.
 */
export function resolveEscolaAccess(user: JWTPayload, escolaIdPedido?: string | null): string | null {
  const caps = capabilitiesFor(user.role)

  if (caps.viewAllEscolas) {
    // SUPER_ADMIN: pode pedir qualquer escola; sem escolaId, não há uma escola "padrão".
    return escolaIdPedido ?? user.escola_id
  }

  // Demais papéis: só a própria escola, e só se bater com o que foi pedido (quando pedido).
  if (!user.escola_id) return null
  if (escolaIdPedido && escolaIdPedido !== user.escola_id) return null
  return user.escola_id
}

/**
 * Turmas que o usuário pode ver. SUPER_ADMIN/ADMIN_ESCOLA/LEITOR veem todas as turmas ativas
 * da escola; PROFESSOR só as turmas vinculadas em professor_turmas.
 */
export async function turmasVisiveis(user: JWTPayload, escolaId: string): Promise<string[]> {
  const caps = capabilitiesFor(user.role)

  if (caps.viewAllTurmasDaEscola) {
    const rows = await db<{ id: string }[]>`
      SELECT id FROM turmas WHERE escola_id = ${escolaId} AND ativo = true
    `
    return rows.map((r) => r.id)
  }

  const rows = await db<{ turma_id: string }[]>`
    SELECT DISTINCT turma_id FROM professor_vinculos
    WHERE professor_id = ${user.id} AND escola_id = ${escolaId} AND ativo = true
  `
  return rows.map((r) => r.turma_id)
}

/** Verifica se o usuário pode ver uma turma específica (respeitando o escopo de professor). */
export async function podeVerTurma(user: JWTPayload, escolaId: string, turmaId: string): Promise<boolean> {
  const visiveis = await turmasVisiveis(user, escolaId)
  return visiveis.includes(turmaId)
}
