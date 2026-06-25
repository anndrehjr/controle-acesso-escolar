import { cookies } from 'next/headers'
import { verifyToken } from './auth'
import type { JWTPayload } from './auth'

export async function requireAuth(): Promise<JWTPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) return null
  return verifyToken(token)
}
