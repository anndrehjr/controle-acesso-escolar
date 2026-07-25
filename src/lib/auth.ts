import { SignJWT, jwtVerify } from 'jose'
import type { Role } from '../types/roles'

export interface JWTPayload {
  id: string
  email: string
  role: Role
  escola_id: string | null
  nome: string
  /** Se a sessão foi criada com "lembrar acesso" — define a política de renovação/TTL */
  lembrar?: boolean
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

export async function signToken(
  payload: JWTPayload,
  opts: { lembrarAcesso?: boolean } = {}
): Promise<string> {
  const lembrar = opts.lembrarAcesso ?? payload.lembrar ?? false
  return await new SignJWT({ ...payload, lembrar })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(lembrar ? SESSION_TTL_LONGA : SESSION_TTL_CURTA)
    .sign(getSecret())
}

export function sessionMaxAgeSeconds(lembrar: boolean): number {
  return lembrar ? 60 * 60 * 24 * 30 : 60 * 60 * 8
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as JWTPayload
  } catch {
    return null
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
