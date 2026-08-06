import { SignJWT, jwtVerify } from 'jose'
import { createHash, randomUUID } from 'crypto'
import type { Role } from '../types/roles'
import db from './db'

export interface JWTPayload {
  id: string
  email: string
  role: Role
  escola_id: string | null
  nome: string
  /**
   * Identificador exclusivo do Dev Master (F-Final/5) — flag própria, separada do papel.
   * Autorização de recursos exclusivos do Dev Master deve sempre checar isDevMaster(payload),
   * nunca só `role === 'DEV_MASTER'`, para não depender só do nome do perfil.
   */
  is_dev_master?: boolean
  /**
   * Troca de senha obrigatória pendente (F-Final/4) — middleware redireciona pra /trocar-senha
   * enquanto isso for true, embarcado no token pra não exigir consulta ao banco a cada request.
   * Fica desatualizado só até o próximo refresh do token depois que a senha for trocada (a
   * própria rota de troca já assina um token novo com essa flag em false).
   */
  deve_trocar_senha?: boolean
  /** Se a sessão foi criada com "lembrar acesso" — define a política de renovação/TTL */
  lembrar?: boolean
  /** Identificador único do token — permite revogar uma sessão específica no logout (F-04) */
  jti?: string
  exp?: number
}

// Checagem só em runtime de requisição (nunca no import do módulo) — se rodasse no import,
// o `next build` quebraria, já que ele carrega as rotas para coleta estática sem envs reais.
let cachedSecret: Uint8Array | null = null
function getSecret(): Uint8Array {
  if (cachedSecret) return cachedSecret
  if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET não definida — obrigatória em produção')
  }
  cachedSecret = new TextEncoder().encode(process.env.JWT_SECRET ?? 'dev-secret-local-apenas')
  return cachedSecret
}

const SESSION_TTL_CURTA = '8h'
const SESSION_TTL_LONGA = '30d'

function tokenHash(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export async function signToken(
  payload: JWTPayload,
  opts: { lembrarAcesso?: boolean } = {}
): Promise<string> {
  const lembrar = opts.lembrarAcesso ?? payload.lembrar ?? false
  const jti = randomUUID()
  return await new SignJWT({ ...payload, lembrar })
    .setProtectedHeader({ alg: 'HS256' })
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(lembrar ? SESSION_TTL_LONGA : SESSION_TTL_CURTA)
    .sign(getSecret())
}

export function sessionMaxAgeSeconds(lembrar: boolean): number {
  return lembrar ? 60 * 60 * 24 * 30 : 60 * 60 * 8
}

/**
 * Verifica assinatura/expiração e, em seguida, se o token não foi revogado (logout — F-04).
 * A checagem de revogação é uma consulta indexada por chave primária (jti), custo desprezível
 * mesmo rodando a cada requisição autenticada (via middleware).
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    const p = payload as unknown as JWTPayload
    if (p.jti) {
      const revogado = await db<{ jti: string }[]>`
        SELECT jti FROM tokens_revogados WHERE jti = ${p.jti} LIMIT 1
      `
      if (revogado.length > 0) return null
    }
    return p
  } catch {
    return null
  }
}

/**
 * Revoga o token atual (logout real, F-04): grava o jti em tokens_revogados até a expiração
 * natural do token, para que ele pare de autenticar mesmo que ainda não tenha expirado.
 * Nunca lança — falha ao revogar não pode travar o logout (o cookie já foi limpo no cliente).
 */
export async function revokeToken(token: string): Promise<void> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    const p = payload as unknown as JWTPayload
    if (!p.jti || !p.exp) return
    await db`
      INSERT INTO tokens_revogados (jti, token_hash, expires_at)
      VALUES (${p.jti}, ${tokenHash(token)}, to_timestamp(${p.exp}))
      ON CONFLICT (jti) DO NOTHING
    `
  } catch (err) {
    console.error('[auth] falha ao revogar token no logout:', err)
  }
}

export function getTokenFromRequest(req: Request): string | null {
  const cookieHeader = req.headers.get('cookie')
  if (!cookieHeader) return null

  const match = cookieHeader.match(/(?:^|;\s*)auth_token=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

/**
 * Verifica autenticação de uma requisição de API. Sem token válido, nunca autentica —
 * não existe mais um modo "sem autenticação" que libera acesso por padrão.
 */
export async function checkApiAuth(req: Request): Promise<JWTPayload | null> {
  const token = getTokenFromRequest(req)
  if (!token) return null
  return verifyToken(token)
}

/**
 * Único jeito correto de checar se é o Dev Master (F-Final/5): exige o papel DEV_MASTER *e*
 * a flag is_dev_master, nunca uma sozinha. Usar em qualquer recurso exclusivo do desenvolvedor
 * (ferramentas internas, configurações globais) em vez de comparar `role === 'DEV_MASTER'`.
 */
export function isDevMaster(payload: JWTPayload | null): boolean {
  return Boolean(payload && payload.role === 'DEV_MASTER' && payload.is_dev_master === true)
}
