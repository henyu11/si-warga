import { db } from '@/db'
import { bills, billItems, households, feeRates } from '@/db/schema'
import { eq, and, isNull, or, like, desc, inArray } from 'drizzle-orm'
import { logAudit } from './audit.service'
import { getActiveFeeRates } from './settings.service'
import type { ActorContext } from './user.service'

export interface GenerateBillsParams {
  year: number
  month: number
  dueDate: string
  actor: ActorContext
}

export interface ListBillsFilters {
  year?: number
  month?: number
  status?: 'UNPAID' | 'PARTIAL' | 'PAID'
  search?: string
}

export async function generateMonthlyBills({
  year,
  month,
  dueDate,
  actor,
}: GenerateBillsParams) {
  // 1. Get active rates
  const rates = await getActiveFeeRates()
  const wajibAmount = rates.IURAN_WAJIB?.amount || 50000
  const keamananAmount = rates.IURAN_KEAMANAN?.amount || 40000

  // 2. Get active households
  const activeHouseholds = await db
    .select()
    .from(households)
    .where(and(eq(households.isBillingActive, 1), isNull(households.deletedAt)))
    .all()

  let createdCount = 0
  let skippedCount = 0

  for (const hh of activeHouseholds) {
    // Check if bill already exists for this household and period
    const existing = await db
      .select({ id: bills.id })
      .from(bills)
      .where(
        and(
          eq(bills.householdId, hh.id),
          eq(bills.periodYear, year),
          eq(bills.periodMonth, month)
        )
      )
      .get()

    if (existing) {
      skippedCount++
      continue
    }

    const billId = `bill-${crypto.randomUUID()}`

    // Insert bill
    await db.insert(bills).values({
      id: billId,
      householdId: hh.id,
      periodYear: year,
      periodMonth: month,
      status: 'UNPAID',
      dueDate,
      generatedBy: actor.id,
    })

    // Insert 2 standard bill items
    await db.insert(billItems).values([
      {
        id: `bi-${crypto.randomUUID()}`,
        billId,
        itemType: 'IURAN_WAJIB',
        amountDue: wajibAmount,
        amountPaid: 0,
        status: 'UNPAID',
      },
      {
        id: `bi-${crypto.randomUUID()}`,
        billId,
        itemType: 'IURAN_KEAMANAN',
        amountDue: keamananAmount,
        amountPaid: 0,
        status: 'UNPAID',
      },
    ])

    createdCount++
  }

  // 3. Audit log
  await logAudit({
    actorUserId: actor.id,
    actorRole: actor.role,
    module: 'BILLING',
    entityType: 'bills',
    entityId: `generate-${year}-${month}`,
    action: 'CREATE',
    newValues: {
      periodYear: year,
      periodMonth: month,
      createdCount,
      skippedCount,
      wajibAmount,
      keamananAmount,
    },
    reason: `Generate tagihan bulanan periode ${month}/${year}`,
    ipAddress: actor.ipAddress,
  })

  return {
    periodYear: year,
    periodMonth: month,
    createdCount,
    skippedCount,
    appliedRates: {
      IURAN_WAJIB: wajibAmount,
      IURAN_KEAMANAN: keamananAmount,
    },
  }
}

export async function listBills(filters: ListBillsFilters = {}) {
  const conditions = []

  if (filters.year) {
    conditions.push(eq(bills.periodYear, filters.year))
  }
  if (filters.month) {
    conditions.push(eq(bills.periodMonth, filters.month))
  }
  if (filters.status) {
    conditions.push(eq(bills.status, filters.status))
  }

  // Fetch bills with household data
  const rawBills = await db
    .select({
      id: bills.id,
      periodYear: bills.periodYear,
      periodMonth: bills.periodMonth,
      status: bills.status,
      dueDate: bills.dueDate,
      createdAt: bills.createdAt,
      householdId: households.id,
      blockNumber: households.blockNumber,
      headName: households.headName,
      phoneWa: households.phoneWa,
      occupancyStatus: households.occupancyStatus,
    })
    .from(bills)
    .innerJoin(households, eq(bills.householdId, households.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(bills.periodYear), desc(bills.periodMonth), households.blockNumber)
    .all()

  // Filter search client/in-memory if requested
  let filtered = rawBills
  if (filters.search) {
    const q = filters.search.toLowerCase()
    filtered = rawBills.filter(
      (b) =>
        b.headName.toLowerCase().includes(q) ||
        b.blockNumber.toLowerCase().includes(q) ||
        b.phoneWa.includes(q)
    )
  }

  // Attach items summary
  const billIds = filtered.map((b) => b.id)
  if (billIds.length === 0) return []

  const items = await db
    .select()
    .from(billItems)
    .where(inArray(billItems.billId, billIds))
    .all()

  const itemsByBill: Record<string, typeof items> = {}
  for (const it of items) {
    if (!itemsByBill[it.billId]) itemsByBill[it.billId] = []
    itemsByBill[it.billId].push(it)
  }

  return filtered.map((b) => {
    const billItemList = itemsByBill[b.id] || []
    const totalDue = billItemList.reduce((acc, curr) => acc + curr.amountDue, 0)
    const totalPaid = billItemList.reduce((acc, curr) => acc + curr.amountPaid, 0)
    return {
      ...b,
      items: billItemList,
      totalDue,
      totalPaid,
    }
  })
}

export async function getBillDetail(billId: string) {
  const bill = await db
    .select({
      id: bills.id,
      periodYear: bills.periodYear,
      periodMonth: bills.periodMonth,
      status: bills.status,
      dueDate: bills.dueDate,
      createdAt: bills.createdAt,
      householdId: households.id,
      blockNumber: households.blockNumber,
      headName: households.headName,
      phoneWa: households.phoneWa,
      occupancyStatus: households.occupancyStatus,
    })
    .from(bills)
    .innerJoin(households, eq(bills.householdId, households.id))
    .where(eq(bills.id, billId))
    .get()

  if (!bill) return null

  const items = await db
    .select()
    .from(billItems)
    .where(eq(billItems.billId, billId))
    .all()

  const totalDue = items.reduce((acc, curr) => acc + curr.amountDue, 0)
  const totalPaid = items.reduce((acc, curr) => acc + curr.amountPaid, 0)

  return {
    ...bill,
    items,
    totalDue,
    totalPaid,
  }
}

export async function addFineToBill({
  billId,
  fineDate,
  fineNote,
  actor,
}: {
  billId: string
  fineDate: string
  fineNote: string
  actor: ActorContext
}) {
  const bill = await getBillDetail(billId)
  if (!bill) {
    throw new Error('Tagihan tidak ditemukan')
  }

  const rates = await getActiveFeeRates()
  const dendaAmount = rates.DENDA_RONDA?.amount || 25000

  const itemId = `bi-${crypto.randomUUID()}`
  const newFineItem = {
    id: itemId,
    billId,
    itemType: 'DENDA_RONDA' as const,
    amountDue: dendaAmount,
    amountPaid: 0,
    status: 'UNPAID' as const,
    fineDate,
    fineNote,
  }

  await db.insert(billItems).values(newFineItem)

  // If bill was marked PAID, update to PARTIAL because now there is an unpaid fine
  if (bill.status === 'PAID') {
    await db
      .update(bills)
      .set({ status: 'PARTIAL', updatedAt: new Date().toISOString() })
      .where(eq(bills.id, billId))
  }

  await logAudit({
    actorUserId: actor.id,
    actorRole: actor.role,
    module: 'BILLING',
    entityType: 'bill_items',
    entityId: itemId,
    action: 'CREATE',
    newValues: {
      billId,
      amountDue: dendaAmount,
      fineDate,
      fineNote,
    },
    reason: `Tambah denda ronda: ${fineNote}`,
    ipAddress: actor.ipAddress,
  })

  return newFineItem
}

export async function overrideBillItem({
  itemId,
  amountDue,
  reason,
  actor,
}: {
  itemId: string
  amountDue: number
  reason: string
  actor: ActorContext
}) {
  const existing = await db
    .select()
    .from(billItems)
    .where(eq(billItems.id, itemId))
    .get()

  if (!existing) {
    throw new Error('Komponen tagihan tidak ditemukan')
  }
  if (existing.status === 'PAID') {
    throw new Error('Komponen yang sudah Lunas tidak dapat dioverride')
  }

  const newStatus =
    existing.amountPaid >= amountDue
      ? 'PAID'
      : existing.amountPaid > 0
      ? 'PARTIAL'
      : 'UNPAID'

  await db
    .update(billItems)
    .set({
      amountDue,
      status: newStatus,
      overrideReason: reason,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(billItems.id, itemId))

  await logAudit({
    actorUserId: actor.id,
    actorRole: actor.role,
    module: 'BILLING',
    entityType: 'bill_items',
    entityId: itemId,
    action: 'OVERRIDE',
    oldValues: { amountDue: existing.amountDue, status: existing.status },
    newValues: { amountDue, status: newStatus },
    reason,
    ipAddress: actor.ipAddress,
  })

  return (await db.select().from(billItems).where(eq(billItems.id, itemId)).get())!
}
