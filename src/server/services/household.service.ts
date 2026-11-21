import { db } from '@/db'
import { households } from '@/db/schema'
import { eq, isNull, and, or, like, desc } from 'drizzle-orm'
import { logAudit } from './audit.service'
import type { ActorContext } from './user.service'

export interface HouseholdDto {
  blockNumber: string
  headName: string
  phoneWa: string
  occupancyStatus?: 'TETAP' | 'KONTRAK' | 'KOSONG'
  isBillingActive?: number
  customRateOverride?: string | null
  notes?: string | null
}

export interface HouseholdFilters {
  search?: string
  occupancyStatus?: string
  isBillingActive?: number
  includeDeleted?: boolean
}

export function normalizePhoneWa(phone: string): string {
  // Strip non-digit characters
  const clean = phone.replace(/\D/g, '')
  if (clean.startsWith('62')) {
    return clean
  }
  if (clean.startsWith('0')) {
    return '62' + clean.slice(1)
  }
  return '62' + clean
}

export async function listHouseholds(filters: HouseholdFilters = {}) {
  const conditions = []

  if (!filters.includeDeleted) {
    conditions.push(isNull(households.deletedAt))
  }

  if (filters.occupancyStatus) {
    conditions.push(
      eq(households.occupancyStatus, filters.occupancyStatus as any)
    )
  }

  if (filters.isBillingActive !== undefined) {
    conditions.push(eq(households.isBillingActive, filters.isBillingActive))
  }

  if (filters.search) {
    const q = `%${filters.search}%`
    conditions.push(
      or(
        like(households.headName, q),
        like(households.blockNumber, q),
        like(households.phoneWa, q)
      )
    )
  }

  const query = db
    .select()
    .from(households)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(households.createdAt))

  return query.all()
}

export async function getHouseholdById(id: string) {
  return db.select().from(households).where(eq(households.id, id)).get() || null
}

export async function createHousehold(data: HouseholdDto, actor: ActorContext) {
  const id = `hh-${crypto.randomUUID()}`
  const normalizedWa = normalizePhoneWa(data.phoneWa)

  const newHousehold = {
    id,
    blockNumber: data.blockNumber,
    headName: data.headName,
    phoneWa: normalizedWa,
    occupancyStatus: data.occupancyStatus || 'TETAP',
    isBillingActive: data.isBillingActive !== undefined ? data.isBillingActive : 1,
    customRateOverride: data.customRateOverride || null,
    notes: data.notes || null,
  }

  await db.insert(households).values(newHousehold)

  await logAudit({
    actorUserId: actor.id,
    actorRole: actor.role,
    module: 'HOUSEHOLD',
    entityType: 'households',
    entityId: id,
    action: 'CREATE',
    newValues: newHousehold,
    ipAddress: actor.ipAddress,
  })

  return (await getHouseholdById(id))!
}

export async function updateHousehold(
  id: string,
  data: Partial<HouseholdDto>,
  actor: ActorContext
) {
  const existing = await getHouseholdById(id)
  if (!existing) {
    throw new Error('Data warga tidak ditemukan')
  }

  const updateValues: Partial<typeof households.$inferInsert> = {
    updatedAt: new Date().toISOString(),
  }

  if (data.blockNumber !== undefined) updateValues.blockNumber = data.blockNumber
  if (data.headName !== undefined) updateValues.headName = data.headName
  if (data.phoneWa !== undefined) updateValues.phoneWa = normalizePhoneWa(data.phoneWa)
  if (data.occupancyStatus !== undefined) updateValues.occupancyStatus = data.occupancyStatus
  if (data.isBillingActive !== undefined) updateValues.isBillingActive = data.isBillingActive
  if (data.customRateOverride !== undefined) updateValues.customRateOverride = data.customRateOverride
  if (data.notes !== undefined) updateValues.notes = data.notes

  await db.update(households).set(updateValues).where(eq(households.id, id))

  await logAudit({
    actorUserId: actor.id,
    actorRole: actor.role,
    module: 'HOUSEHOLD',
    entityType: 'households',
    entityId: id,
    action: 'UPDATE',
    oldValues: existing,
    newValues: data,
    ipAddress: actor.ipAddress,
  })

  return (await getHouseholdById(id))!
}

export async function softDeleteHousehold(id: string, actor: ActorContext) {
  const existing = await getHouseholdById(id)
  if (!existing) {
    throw new Error('Data warga tidak ditemukan')
  }

  const now = new Date().toISOString()
  await db
    .update(households)
    .set({
      deletedAt: now,
      isBillingActive: 0,
      updatedAt: now,
    })
    .where(eq(households.id, id))

  await logAudit({
    actorUserId: actor.id,
    actorRole: actor.role,
    module: 'HOUSEHOLD',
    entityType: 'households',
    entityId: id,
    action: 'SOFT_DELETE',
    oldValues: { blockNumber: existing.blockNumber, headName: existing.headName },
    reason: 'Warga nonaktif / pindah',
    ipAddress: actor.ipAddress,
  })
}
