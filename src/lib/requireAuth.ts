import { cookies } from 'next/headers'
import { verifyToken } from './auth'
import type { JWTPayload } from './auth'

const MOCK_ADMIN: JWTPayload = {
  id: 'system',
  email: 'admin@escola',
  role: 'SUPER_ADMIN',
  escola_id: process.env.NEXT_PUBLIC_ESCOLA_ID ?? null,
  nome: 'Administrador',
}

export async function requireAuth(): Promise<JWTPayload | null> {
  if (process.env.AUTH_ENABLED !== 'true') return MOCK_ADMIN
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) return null
  return verifyToken(token)
}
