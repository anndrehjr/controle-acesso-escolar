import db from './db'

const MAX_TENTATIVAS = 5
const JANELA_MINUTOS = 15

export interface StatusBloqueio {
  bloqueado: boolean
  tentativasRestantes: number
  minutosParaLiberar: number
}

/**
 * Verifica se um e-mail ou IP está temporariamente bloqueado por excesso de tentativas de
 * login inválidas na janela recente. Checa os dois separadamente: um IP bloqueado não deveria
 * travar outro usuário do mesmo e-mail vindo de outro lugar, e vice-versa — por isso o bloqueio
 * vale se QUALQUER um dos dois estourar o limite.
 */
export async function verificarBloqueio(email: string, ip: string): Promise<StatusBloqueio> {
  const [porEmail, porIp] = await Promise.all([
    db<{ total: number }[]>`
      SELECT count(*)::int AS total FROM tentativas_login
      WHERE email = ${email.toLowerCase().trim()}
        AND sucesso = false
        AND created_at > now() - (${JANELA_MINUTOS} || ' minutes')::interval
    `,
    db<{ total: number }[]>`
      SELECT count(*)::int AS total FROM tentativas_login
      WHERE ip = ${ip}
        AND sucesso = false
        AND created_at > now() - (${JANELA_MINUTOS} || ' minutes')::interval
    `,
  ])

  const total = Math.max(porEmail[0]?.total ?? 0, porIp[0]?.total ?? 0)
  const bloqueado = total >= MAX_TENTATIVAS

  return {
    bloqueado,
    tentativasRestantes: Math.max(0, MAX_TENTATIVAS - total),
    minutosParaLiberar: bloqueado ? JANELA_MINUTOS : 0,
  }
}

export async function registrarTentativaLogin(email: string, ip: string, sucesso: boolean): Promise<void> {
  await db`
    INSERT INTO tentativas_login (email, ip, sucesso)
    VALUES (${email.toLowerCase().trim()}, ${ip}, ${sucesso})
  `

  // Limpeza oportunista: não deixa a tabela crescer sem limite (sem precisar de um cron dedicado).
  if (Math.random() < 0.05) {
    await db`DELETE FROM tentativas_login WHERE created_at < now() - interval '7 days'`.catch(() => {})
  }
}

export function ipDaRequisicao(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'desconhecido'
  )
}
