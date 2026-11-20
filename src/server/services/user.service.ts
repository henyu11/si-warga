import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { hashPassword } from '@/lib/password'
import { logAudit } from './audit.service'
import type { UserPublic } from './auth.service'

export interface CreateUserDto {
  fullName: string
  username: string
  email?: string | null
  password: string
  role: 'ADMIN' | 'BENDAHARA' | 'KETUA'
}

export interface UpdateUserDto {
  fullName?: string
  username?: string
  email?: string | null
  password?: string
  role?: 'ADMIN' | 'BENDAHARA' | 'KETUA'
  isActive?: number
}

export interface ActorContext {
  id: string
  role: string
  ipAddress?: string
}

export async function listUsers(): Promise<UserPublic[]> {
  const records = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      username: users.username,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
    })
    .from(users)
    .all()

  return records
}

export async function getUserById(id: string): Promise<UserPublic | null> {
  const record = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      username: users.username,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.id, id))
    .get()

  return record || null
}

export async function createUser(
  data: CreateUserDto,
  actor: ActorContext
): Promise<UserPublic> {
  const hashedPassword = await hashPassword(data.password)
  const id = `u-${crypto.randomUUID()}`

  const newUser = {
    id,
    fullName: data.fullName,
    username: data.username,
    email: data.email || null,
    passwordHash: hashedPassword,
    role: data.role,
    isActive: 1,
  }

  await db.insert(users).values(newUser)

  await logAudit({
    actorUserId: actor.id,
    actorRole: actor.role,
    module: 'USER',
    entityType: 'users',
    entityId: id,
    action: 'CREATE',
    newValues: {
      fullName: data.fullName,
      username: data.username,
      email: data.email,
      role: data.role,
    },
    ipAddress: actor.ipAddress,
  })

  return {
    id,
    fullName: data.fullName,
    username: data.username,
    email: data.email || null,
    role: data.role,
    isActive: 1,
  }
}

export async function updateUser(
  id: string,
  data: UpdateUserDto,
  actor: ActorContext
): Promise<UserPublic> {
  const existing = await getUserById(id)
  if (!existing) {
    throw new Error('User tidak ditemukan')
  }

  const updateValues: Partial<typeof users.$inferInsert> = {
    updatedAt: new Date().toISOString(),
  }

  if (data.fullName !== undefined) updateValues.fullName = data.fullName
  if (data.username !== undefined) updateValues.username = data.username
  if (data.email !== undefined) updateValues.email = data.email
  if (data.role !== undefined) updateValues.role = data.role
  if (data.isActive !== undefined) updateValues.isActive = data.isActive
  if (data.password) {
    updateValues.passwordHash = await hashPassword(data.password)
  }

  await db.update(users).set(updateValues).where(eq(users.id, id))

  await logAudit({
    actorUserId: actor.id,
    actorRole: actor.role,
    module: 'USER',
    entityType: 'users',
    entityId: id,
    action: 'UPDATE',
    oldValues: existing,
    newValues: data,
    ipAddress: actor.ipAddress,
  })

  const updated = await getUserById(id)
  return updated!
}

export async function deactivateUser(
  id: string,
  actor: ActorContext
): Promise<void> {
  const existing = await getUserById(id)
  if (!existing) {
    throw new Error('User tidak ditemukan')
  }

  await db
    .update(users)
    .set({
      isActive: 0,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, id))

  await logAudit({
    actorUserId: actor.id,
    actorRole: actor.role,
    module: 'USER',
    entityType: 'users',
    entityId: id,
    action: 'UPDATE',
    oldValues: { isActive: existing.isActive },
    newValues: { isActive: 0 },
    reason: 'Nonaktifkan akun pengguna',
    ipAddress: actor.ipAddress,
  })
}
