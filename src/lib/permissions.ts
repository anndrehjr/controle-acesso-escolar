import db from './db'
import { capabilitiesFor } from '../types/roles'
import type { JWTPayload } from './auth'

export function resolveEscolaAccess(user: JWTPayload, escolaIdPedido?: string | null): string | null {
  const caps = capabilitiesFor(user.role)
  if (caps.viewAllEscolas) return escolaIdPedido ?? user.escola_id
  if (!user.escola_id) return null
  if (escolaIdPedido && escolaIdPedido !== user.escola_id) return null
  return user.escola_id
}

export async function turmasVisiveis(user: JWTPayload, escolaId: string): Promise<string[]> {
  const caps = capabilitiesFor(user.role)
  if (caps.viewAllTurmasDaEscola) {
    const rows = await db<{ id: string }[]>`
      SELECT id FROM turmas WHERE escola_id = ${escolaId} AND ativo = true
    `
    return rows.map((row) => row.id)
  }

  const rows = await db<{ turma_id: string }[]>`
    SELECT DISTINCT turma_id FROM professor_vinculos
    WHERE professor_id = ${user.id} AND escola_id = ${escolaId} AND ativo = true
  `
  return rows.map((row) => row.turma_id)
}

export async function podeVerTurma(user: JWTPayload, escolaId: string, turmaId: string): Promise<boolean> {
  const visiveis = await turmasVisiveis(user, escolaId)
  return visiveis.includes(turmaId)
}

/**
 * null significa acesso a todas as disciplinas da turma. Para professor, um vínculo sem
 * disciplina também concede o diário completo daquela turma; vínculos específicos retornam
 * somente as disciplinas atribuídas.
 */
export async function disciplinasVisiveisNaTurma(
  user: JWTPayload,
  escolaId: string,
  turmaId: string,
): Promise<string[] | null> {
  if (capabilitiesFor(user.role).viewAllTurmasDaEscola) return null

  const rows = await db<{ disciplina_id: string | null }[]>`
    SELECT disciplina_id FROM professor_vinculos
    WHERE professor_id = ${user.id}
      AND escola_id = ${escolaId}
      AND turma_id = ${turmaId}
      AND ativo = true
  `
  if (rows.some((row) => row.disciplina_id === null)) return null
  return rows.flatMap((row) => row.disciplina_id ? [row.disciplina_id] : [])
}

export async function podeLancarDisciplina(
  user: JWTPayload,
  escolaId: string,
  turmaId: string,
  disciplinaId: string,
): Promise<boolean> {
  const permitidas = await disciplinasVisiveisNaTurma(user, escolaId, turmaId)
  return permitidas === null || permitidas.includes(disciplinaId)
}
