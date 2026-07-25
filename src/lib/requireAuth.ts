import { cookies } from 'next/headers'
import { verifyToken } from './auth'
import type { JWTPayload } from './auth'

/**
 * Lê e valida a sessão do usuário atual a partir do cookie httpOnly.
 * Sem cookie ou token inválido/expirado, retorna null — nunca um usuário fictício.
 */
export async function requireAuth(): Promise<JWTPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) return null
  return verifyToken(token)
}
