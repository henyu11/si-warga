import { SignJWT, jwtVerify } from 'jose'

const secretKey = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super-secret-jwt-key-min-32-chars-long!'
)

export interface JwtPayload {
  userId: string
  role: 'ADMIN' | 'BENDAHARA' | 'KETUA'
}

export async function signJwt(payload: { userId: string; role: string }): Promise<string> {
  return new SignJWT({
    userId: payload.userId,
    role: payload.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secretKey)
}

export async function verifyJwt(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey)
    if (typeof payload.userId === 'string' && typeof payload.role === 'string') {
      return {
        userId: payload.userId,
        role: payload.role as JwtPayload['role'],
      }
    }
    return null
  } catch {
    return null
  }
}
