import { db } from '@/db'
import {
  payments,
  paymentAllocations,
  bills,
  billItems,
  cashBooks,
  cashCategories,
  cashTransactions,
  households,
} from '@/db/schema'
import { eq, inArray, and } from 'drizzle-orm'
import { logAudit } from './audit.service'
import type { ActorContext } from './user.service'

export interface PaymentAllocationInput {
  billItemId: string
  amount: number
}

export interface RecordPaymentDto {
  billId: string
  paymentMethod: 'TUNAI' | 'TRANSFER'
  allocations: PaymentAllocationInput[]
  receiptFileKey?: string | null
  notes?: string | null
}

export async function recordPayment(
  data: RecordPaymentDto,
  actor: ActorContext
) {
  const bill = await db
    .select({
      id: bills.id,
      householdId: bills.householdId,
      periodYear: bills.periodYear,
      periodMonth: bills.periodMonth,
      blockNumber: households.blockNumber,
      headName: households.headName,
    })
    .from(bills)
    .innerJoin(households, eq(bills.householdId, households.id))
    .where(eq(bills.id, data.billId))
    .get()

  if (!bill) {
    throw new Error('Tagihan tidak ditemukan')
  }

  const totalPaid = data.allocations.reduce((sum, a) => sum + a.amount, 0)
  if (totalPaid <= 0) {
    throw new Error('Total nominal pembayaran harus lebih dari 0')
  }

  // 1. Fetch cash books
  const allCashBooks = await db.select().from(cashBooks).all()
  const kasUmumBook = allCashBooks.find((b) => b.bookType === 'KAS_UMUM')
  const kasKeamananBook = allCashBooks.find((b) => b.bookType === 'KAS_KEAMANAN')

  if (!kasUmumBook || !kasKeamananBook) {
    throw new Error('Buku Kas Umum atau Kas Keamanan belum terkonfigurasi')
  }

  // Fetch default categories
  const categories = await db.select().from(cashCategories).all()
  const catUmumDefault = categories.find(
    (c) => c.cashBookId === kasUmumBook.id && c.transactionType === 'INCOME' && c.isDefault === 1
  )
  const catKeamananDefault = categories.find(
    (c) => c.cashBookId === kasKeamananBook.id && c.transactionType === 'INCOME' && c.isDefault === 1
  )

  // 2. Insert Payment record
  const paymentId = `pay-${crypto.randomUUID()}`
  const now = new Date().toISOString()
  const today = now.split('T')[0]

  await db.insert(payments).values({
    id: paymentId,
    billId: data.billId,
    paidAmount: totalPaid,
    paymentMethod: data.paymentMethod,
    receiptFileKey: data.receiptFileKey || null,
    notes: data.notes || null,
    isVoided: 0,
    createdBy: actor.id,
  })

  // 3. Inspect items and map amounts per cash book
  const itemIds = data.allocations.map((a) => a.billItemId)
  const itemsInDb = await db
    .select()
    .from(billItems)
    .where(inArray(billItems.id, itemIds))
    .all()

  const itemMap = new Map(itemsInDb.map((i) => [i.id, i]))

  let umumAmount = 0
  let keamananAmount = 0

  for (const alloc of data.allocations) {
    const item = itemMap.get(alloc.billItemId)
    if (!item) continue

    if (item.itemType === 'IURAN_WAJIB') {
      umumAmount += alloc.amount
    } else {
      // IURAN_KEAMANAN and DENDA_RONDA
      keamananAmount += alloc.amount
    }
  }

  // 4. Create locked cash transactions
  let txUmumId: string | null = null
  let txKeamananId: string | null = null

  if (umumAmount > 0) {
    txUmumId = `ctx-${crypto.randomUUID()}`
    await db.insert(cashTransactions).values({
      id: txUmumId,
      cashBookId: kasUmumBook.id,
      categoryId: catUmumDefault?.id || null,
      transactionType: 'INCOME',
      amount: umumAmount,
      description: `Pembayaran Iuran Wajib: ${bill.headName} (${bill.blockNumber}) periode ${bill.periodMonth}/${bill.periodYear}`,
      transactionDate: today,
      paymentId: paymentId,
      receiptFileKey: data.receiptFileKey || null,
      isLocked: 1,
      status: 'POSTED',
      createdBy: actor.id,
    })
  }

  if (keamananAmount > 0) {
    txKeamananId = `ctx-${crypto.randomUUID()}`
    await db.insert(cashTransactions).values({
      id: txKeamananId,
      cashBookId: kasKeamananBook.id,
      categoryId: catKeamananDefault?.id || null,
      transactionType: 'INCOME',
      amount: keamananAmount,
      description: `Pembayaran Iuran Keamanan/Denda: ${bill.headName} (${bill.blockNumber}) periode ${bill.periodMonth}/${bill.periodYear}`,
      transactionDate: today,
      paymentId: paymentId,
      receiptFileKey: data.receiptFileKey || null,
      isLocked: 1,
      status: 'POSTED',
      createdBy: actor.id,
    })
  }

  // 5. Insert payment allocations and update bill_items
  for (const alloc of data.allocations) {
    const item = itemMap.get(alloc.billItemId)
    if (!item) continue

    const isUmum = item.itemType === 'IURAN_WAJIB'
    const targetBookId = isUmum ? kasUmumBook.id : kasKeamananBook.id
    const targetTxId = isUmum ? txUmumId! : txKeamananId!

    await db.insert(paymentAllocations).values({
      id: `pa-${crypto.randomUUID()}`,
      paymentId: paymentId,
      billItemId: alloc.billItemId,
      allocatedAmount: alloc.amount,
      cashBookId: targetBookId,
      cashTransactionId: targetTxId,
    })

    const newAmountPaid = item.amountPaid + alloc.amount
    const newStatus =
      newAmountPaid >= item.amountDue
        ? 'PAID'
        : newAmountPaid > 0
        ? 'PARTIAL'
        : 'UNPAID'

    await db
      .update(billItems)
      .set({
        amountPaid: newAmountPaid,
        status: newStatus,
        updatedAt: now,
      })
      .where(eq(billItems.id, item.id))
  }

  // 6. Update overall Bill status
  const allBillItems = await db
    .select()
    .from(billItems)
    .where(eq(billItems.billId, data.billId))
    .all()

  const allPaid = allBillItems.every((i) => i.status === 'PAID')
  const anyPaidOrPartial = allBillItems.some(
    (i) => i.status === 'PAID' || i.status === 'PARTIAL'
  )
  const newBillStatus = allPaid ? 'PAID' : anyPaidOrPartial ? 'PARTIAL' : 'UNPAID'

  await db
    .update(bills)
    .set({
      status: newBillStatus,
      updatedAt: now,
    })
    .where(eq(bills.id, data.billId))

  // 7. Audit Log
  await logAudit({
    actorUserId: actor.id,
    actorRole: actor.role,
    module: 'PAYMENT',
    entityType: 'payments',
    entityId: paymentId,
    action: 'CREATE',
    newValues: {
      billId: data.billId,
      paidAmount: totalPaid,
      paymentMethod: data.paymentMethod,
      umumAmount,
      keamananAmount,
    },
    reason: `Catat bayar iuran warga ${bill.headName} (${bill.blockNumber})`,
    ipAddress: actor.ipAddress,
  })

  return {
    id: paymentId,
    billId: data.billId,
    paidAmount: totalPaid,
    paymentMethod: data.paymentMethod,
    createdAt: now,
  }
}

export async function voidPayment(
  paymentId: string,
  { reason }: { reason: string },
  actor: ActorContext
) {
  const payment = await db
    .select()
    .from(payments)
    .where(eq(payments.id, paymentId))
    .get()

  if (!payment) {
    throw new Error('Pembayaran tidak ditemukan')
  }
  if (payment.isVoided === 1) {
    throw new Error('Pembayaran sudah dibatalkan sebelumnya')
  }

  const now = new Date().toISOString()

  // 1. Mark payment as voided
  await db
    .update(payments)
    .set({
      isVoided: 1,
      voidReason: reason,
      voidedBy: actor.id,
      voidedAt: now,
      updatedAt: now,
    })
    .where(eq(payments.id, paymentId))

  // 2. Void all connected cash transactions
  await db
    .update(cashTransactions)
    .set({
      status: 'VOIDED',
      voidReason: reason,
      voidedBy: actor.id,
      voidedAt: now,
      updatedAt: now,
    })
    .where(eq(cashTransactions.paymentId, paymentId))

  // 3. Revert bill items amounts
  const allocations = await db
    .select()
    .from(paymentAllocations)
    .where(eq(paymentAllocations.paymentId, paymentId))
    .all()

  for (const alloc of allocations) {
    const item = await db
      .select()
      .from(billItems)
      .where(eq(billItems.id, alloc.billItemId))
      .get()

    if (!item) continue

    const newAmountPaid = Math.max(0, item.amountPaid - alloc.allocatedAmount)
    const newStatus =
      newAmountPaid >= item.amountDue
        ? 'PAID'
        : newAmountPaid > 0
        ? 'PARTIAL'
        : 'UNPAID'

    await db
      .update(billItems)
      .set({
        amountPaid: newAmountPaid,
        status: newStatus,
        updatedAt: now,
      })
      .where(eq(billItems.id, item.id))
  }

  // 4. Re-evaluate Bill status
  const allBillItems = await db
    .select()
    .from(billItems)
    .where(eq(billItems.billId, payment.billId))
    .all()

  const allPaid = allBillItems.every((i) => i.status === 'PAID')
  const anyPaidOrPartial = allBillItems.some(
    (i) => i.status === 'PAID' || i.status === 'PARTIAL'
  )
  const newBillStatus = allPaid ? 'PAID' : anyPaidOrPartial ? 'PARTIAL' : 'UNPAID'

  await db
    .update(bills)
    .set({
      status: newBillStatus,
      updatedAt: now,
    })
    .where(eq(bills.id, payment.billId))

  // 5. Audit Log
  await logAudit({
    actorUserId: actor.id,
    actorRole: actor.role,
    module: 'PAYMENT',
    entityType: 'payments',
    entityId: paymentId,
    action: 'VOID',
    reason,
    oldValues: { paidAmount: payment.paidAmount, billId: payment.billId },
    ipAddress: actor.ipAddress,
  })
}
