import { db } from '@/db'
import { users } from '@/db/schema'
import { eq, or } from 'drizzle-orm'
import { comparePassword } from '@/lib/password'
import { verifyJwt, signJwt } from '@/lib/auth'
import { cookies } from 'next/headers'

export interface UserPublic {
  id: string
  fullName: string
  username: string
  email: string | null
  role: 'ADMIN' | 'BENDAHARA' | 'KETUA'
  isActive: number
}

export interface SessionUser {
  id: string
  fullName: string
  username: string
  email: string | null
  role: 'ADMIN' | 'BENDAHARA' | 'KETUA'
}

export const SESSION_COOKIE_NAME = 'rtrw_session'

export async function loginUser(
  identifier: string,
  plainPassword: string
): Promise<{ user: UserPublic; token: string } | { error: string }> {
  const user = await db
    .select()
    .from(users)
    .where(or(eq(users.username, identifier), eq(users.email, identifier)))
    .get()

  if (!user || user.isActive === 0) {
    return { error: 'Username/email atau password salah.' }
  }

  const isPasswordValid = await comparePassword(plainPassword, user.passwordHash)
  if (!isPasswordValid) {
    return { error: 'Username/email atau password salah.' }
  }

  const token = await signJwt({
    userId: user.id,
    role: user.role,
  })

  const userPublic: UserPublic = {
    id: user.id,
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  }

  return { user: userPublic, token }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!token) return null

  const payload = await verifyJwt(token)
  if (!payload) return null

  const user = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      username: users.username,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.id, payload.userId))
    .get()

  if (!user || user.isActive === 0) return null

  return user
}
