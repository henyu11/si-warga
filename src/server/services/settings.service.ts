import { db } from '@/db'
import { feeRates, appSettings, billItems, bills } from '@/db/schema'
import { eq, and, desc, inArray } from 'drizzle-orm'
import { logAudit } from './audit.service'
import type { ActorContext } from './user.service'

export interface CreateFeeRateDto {
  feeType: 'IURAN_WAJIB' | 'IURAN_KEAMANAN' | 'DENDA_RONDA'
  amount: number
  effectiveFrom: string
  changeReason: string
  applyToUnpaidCurrentMonth?: boolean
}

export async function getActiveFeeRates() {
  const activeList = await db
    .select()
    .from(feeRates)
    .where(eq(feeRates.isActive, 1))
    .all()

  const map: Record<string, typeof feeRates.$inferSelect> = {}
  for (const rate of activeList) {
    map[rate.feeType] = rate
  }

  const history = await db
    .select()
    .from(feeRates)
    .orderBy(desc(feeRates.createdAt))
    .all()

  return {
    ...map,
    IURAN_WAJIB: map.IURAN_WAJIB,
    IURAN_KEAMANAN: map.IURAN_KEAMANAN,
    DENDA_RONDA: map.DENDA_RONDA,
    history,
  }
}

export async function getImpactPreview(
  feeType: 'IURAN_WAJIB' | 'IURAN_KEAMANAN' | 'DENDA_RONDA',
  year: number,
  month: number
) {
  // Query all bills for that month/year
  const monthBills = await db
    .select({ id: bills.id })
    .from(bills)
    .where(and(eq(bills.periodYear, year), eq(bills.periodMonth, month)))
    .all()

  if (monthBills.length === 0) {
    return { affectedCount: 0 }
  }

  const billIds = monthBills.map((b) => b.id)

  const unpaidItems = await db
    .select({ id: billItems.id })
    .from(billItems)
    .where(
      and(
        inArray(billItems.billId, billIds),
        eq(billItems.itemType, feeType),
        eq(billItems.status, 'UNPAID')
      )
    )
    .all()

  return { affectedCount: unpaidItems.length }
}

export async function createFeeRate(
  data: CreateFeeRateDto,
  actor: ActorContext
) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  // 1. Get old active rate
  const oldActiveRate = await db
    .select()
    .from(feeRates)
    .where(and(eq(feeRates.feeType, data.feeType), eq(feeRates.isActive, 1)))
    .get()

  // 2. Deactivate previous rate
  if (oldActiveRate) {
    await db
      .update(feeRates)
      .set({ isActive: 0 })
      .where(eq(feeRates.id, oldActiveRate.id))
  }

  // 3. Insert new fee rate
  const newId = `fr-${crypto.randomUUID()}`
  const newRate = {
    id: newId,
    feeType: data.feeType,
    amount: data.amount,
    effectiveFrom: data.effectiveFrom,
    isActive: 1,
    changeReason: data.changeReason,
    createdBy: actor.id,
  }

  await db.insert(feeRates).values(newRate)

  let affectedCount = 0

  // 4. Optionally update unpaid bills for current month
  if (data.applyToUnpaidCurrentMonth) {
    const currentBills = await db
      .select({ id: bills.id })
      .from(bills)
      .where(and(eq(bills.periodYear, currentYear), eq(bills.periodMonth, currentMonth)))
      .all()

    if (currentBills.length > 0) {
      const billIds = currentBills.map((b) => b.id)

      const updateResult = await db
        .update(billItems)
        .set({
          amountDue: data.amount,
          overrideReason: `Penyesuaian tarif aktif: ${data.changeReason}`,
          updatedAt: new Date().toISOString(),
        })
        .where(
          and(
            inArray(billItems.billId, billIds),
            eq(billItems.itemType, data.feeType),
            eq(billItems.status, 'UNPAID')
          )
        )

      const preview = await getImpactPreview(data.feeType, currentYear, currentMonth)
      affectedCount = preview.affectedCount
    }
  }

  // 5. Audit Log
  await logAudit({
    actorUserId: actor.id,
    actorRole: actor.role,
    module: 'TARIFF',
    entityType: 'fee_rates',
    entityId: newId,
    action: 'RATE_CHANGE',
    oldValues: oldActiveRate ? { amount: oldActiveRate.amount, effectiveFrom: oldActiveRate.effectiveFrom } : null,
    newValues: {
      amount: data.amount,
      effectiveFrom: data.effectiveFrom,
      applyToUnpaidCurrentMonth: data.applyToUnpaidCurrentMonth,
      affectedCount,
    },
    reason: data.changeReason,
    ipAddress: actor.ipAddress,
  })

  return {
    feeRate: newRate,
    affectedCount,
  }
}

export const DEFAULT_APP_SETTINGS: Record<string, string> = {
  app_name: 'siWarga Palmut',
  community_name: 'Kavling Palanji & Mutiara Indah',
  rekening_kas_umum: 'BCA 1234567890 a.n. Kas Palmut',
  rekening_kas_keamanan: 'Mandiri 0987654321 a.n. Kas Keamanan Palmut',
  wa_billing_template:
    'Yth. Bpk/Ibu *{nama}* (Blok {blok}),\nBerikut rincian tagihan iuran periode *{bulan_tahun}*:\n- Iuran Wajib: {iuran_wajib}\n- Iuran Keamanan: {iuran_keamanan}\n- Denda Ronda: {denda}\n*Total Tagihan: {total}*\n\nPembayaran dapat ditransfer ke {rekening} atau tunai ke Bendahara.\nTerima kasih atas partisipasinya.',
}

export async function getAppSettings(): Promise<Record<string, string>> {
  const records = await db.select().from(appSettings).all()
  const map: Record<string, string> = { ...DEFAULT_APP_SETTINGS }
  for (const item of records) {
    if (item.value !== null && item.value !== undefined) {
      map[item.key] = item.value
    }
  }
  return map
}

export async function updateAppSettings(
  settings: Record<string, string>,
  actor: ActorContext
) {
  const oldSettings = await getAppSettings()

  for (const [key, value] of Object.entries(settings)) {
    const existing = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, key))
      .get()

    if (existing) {
      await db
        .update(appSettings)
        .set({
          value,
          updatedBy: actor.id,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(appSettings.key, key))
    } else {
      await db.insert(appSettings).values({
        key,
        value,
        updatedBy: actor.id,
      })
    }
  }

  await logAudit({
    actorUserId: actor.id,
    actorRole: actor.role,
    module: 'SETTINGS',
    entityType: 'app_settings',
    entityId: 'global_settings',
    action: 'UPDATE',
    oldValues: oldSettings,
    newValues: settings,
    reason: 'Pembaruan nomor rekening kas / template WhatsApp',
    ipAddress: actor.ipAddress,
  })
}
