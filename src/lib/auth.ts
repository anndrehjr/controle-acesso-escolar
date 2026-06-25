import { SignJWT, jwtVerify } from 'jose'

export interface JWTPayload {
  id: string
  email: string
  role: string
  escola_id: string | null
  nome: string
}

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)

export async function signToken(payload: JWTPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(secret)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
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
