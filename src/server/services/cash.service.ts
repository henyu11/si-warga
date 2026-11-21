import { db } from '@/db'
import { cashBooks, cashCategories, cashTransactions } from '@/db/schema'
import { eq, and, sql, desc, lt, gte, lte } from 'drizzle-orm'
import { logAudit } from './audit.service'
import { randomUUID } from 'crypto'

export interface CashBookSummaryItem {
  id: string
  bookType: 'KAS_UMUM' | 'KAS_KEAMANAN'
  name: string
  bankName: string | null
  accountNumber: string | null
  balance: number
  totalIncome: number
  totalExpense: number
  categories: Array<{
    id: string
    name: string
    transactionType: 'INCOME' | 'EXPENSE'
    isDefault: number
  }>
}

export interface CashBooksSummary {
  kasUmum: CashBookSummaryItem
  kasKeamanan: CashBookSummaryItem
}

export async function getCashBooksSummary(): Promise<CashBooksSummary> {
  const books = await db.select().from(cashBooks).all()

  const categories = await db.select().from(cashCategories).all()

  // Calculate balance for each book
  const totals = await db
    .select({
      cashBookId: cashTransactions.cashBookId,
      transactionType: cashTransactions.transactionType,
      totalAmount: sql<number>`coalesce(sum(${cashTransactions.amount}), 0)`,
    })
    .from(cashTransactions)
    .where(eq(cashTransactions.status, 'POSTED'))
    .groupBy(cashTransactions.cashBookId, cashTransactions.transactionType)
    .all()

  const getBookItem = (type: 'KAS_UMUM' | 'KAS_KEAMANAN'): CashBookSummaryItem => {
    const book = books.find((b) => b.bookType === type)
    if (!book) {
      throw new Error(`Buku kas ${type} tidak ditemukan`)
    }

    const income =
      totals.find((t) => t.cashBookId === book.id && t.transactionType === 'INCOME')
        ?.totalAmount || 0
    const expense =
      totals.find((t) => t.cashBookId === book.id && t.transactionType === 'EXPENSE')
        ?.totalAmount || 0
    const balance = income - expense

    const bookCategories = categories
      .filter((c) => c.cashBookId === book.id)
      .map((c) => ({
        id: c.id,
        name: c.name,
        transactionType: c.transactionType as 'INCOME' | 'EXPENSE',
        isDefault: c.isDefault,
      }))

    return {
      id: book.id,
      bookType: book.bookType as 'KAS_UMUM' | 'KAS_KEAMANAN',
      name: book.name,
      bankName: book.bankName,
      accountNumber: book.accountNumber,
      balance,
      totalIncome: income,
      totalExpense: expense,
      categories: bookCategories,
    }
  }

  return {
    kasUmum: getBookItem('KAS_UMUM'),
    kasKeamanan: getBookItem('KAS_KEAMANAN'),
  }
}

export async function listTransactions(filters: {
  bookType?: 'KAS_UMUM' | 'KAS_KEAMANAN'
  cashBookId?: string
  year?: number
  month?: number
  categoryId?: string
  transactionType?: 'INCOME' | 'EXPENSE'
}) {
  let targetBookId = filters.cashBookId
  if (!targetBookId && filters.bookType) {
    const book = await db
      .select()
      .from(cashBooks)
      .where(eq(cashBooks.bookType, filters.bookType))
      .get()
    if (book) targetBookId = book.id
  }

  if (!targetBookId) {
    const defaultBook = await db
      .select()
      .from(cashBooks)
      .where(eq(cashBooks.bookType, 'KAS_UMUM'))
      .get()
    targetBookId = defaultBook?.id
  }

  const book = await db
    .select()
    .from(cashBooks)
    .where(eq(cashBooks.id, targetBookId!))
    .get()

  // Date range
  let startStr = ''
  let endStr = ''
  let hasPeriod = false
  if (filters.year && filters.month) {
    hasPeriod = true
    const mm = String(filters.month).padStart(2, '0')
    startStr = `${filters.year}-${mm}-01`
    const lastDay = new Date(filters.year, filters.month, 0).getDate()
    endStr = `${filters.year}-${mm}-${String(lastDay).padStart(2, '0')}`
  }

  // Calculate opening balance if period filter is applied
  let openingBalance = 0
  if (hasPeriod) {
    const prevIncomeRow = await db
      .select({
        total: sql<number>`coalesce(sum(${cashTransactions.amount}), 0)`,
      })
      .from(cashTransactions)
      .where(
        and(
          eq(cashTransactions.cashBookId, targetBookId!),
          eq(cashTransactions.status, 'POSTED'),
          eq(cashTransactions.transactionType, 'INCOME'),
          lt(cashTransactions.transactionDate, startStr)
        )
      )
      .get()

    const prevExpenseRow = await db
      .select({
        total: sql<number>`coalesce(sum(${cashTransactions.amount}), 0)`,
      })
      .from(cashTransactions)
      .where(
        and(
          eq(cashTransactions.cashBookId, targetBookId!),
          eq(cashTransactions.status, 'POSTED'),
          eq(cashTransactions.transactionType, 'EXPENSE'),
          lt(cashTransactions.transactionDate, startStr)
        )
      )
      .get()

    openingBalance = (prevIncomeRow?.total || 0) - (prevExpenseRow?.total || 0)
  }

  // Conditions for list
  const conditions = [eq(cashTransactions.cashBookId, targetBookId!)]
  if (hasPeriod) {
    conditions.push(gte(cashTransactions.transactionDate, startStr))
    conditions.push(lte(cashTransactions.transactionDate, endStr))
  }
  if (filters.categoryId) {
    conditions.push(eq(cashTransactions.categoryId, filters.categoryId))
  }
  if (filters.transactionType) {
    conditions.push(eq(cashTransactions.transactionType, filters.transactionType))
  }

  const transactions = await db
    .select({
      id: cashTransactions.id,
      cashBookId: cashTransactions.cashBookId,
      categoryId: cashTransactions.categoryId,
      categoryName: cashCategories.name,
      transactionType: cashTransactions.transactionType,
      amount: cashTransactions.amount,
      description: cashTransactions.description,
      transactionDate: cashTransactions.transactionDate,
      paymentId: cashTransactions.paymentId,
      receiptFileKey: cashTransactions.receiptFileKey,
      isLocked: cashTransactions.isLocked,
      status: cashTransactions.status,
      voidReason: cashTransactions.voidReason,
      createdAt: cashTransactions.createdAt,
    })
    .from(cashTransactions)
    .leftJoin(cashCategories, eq(cashTransactions.categoryId, cashCategories.id))
    .where(and(...conditions))
    .orderBy(desc(cashTransactions.transactionDate), desc(cashTransactions.createdAt))
    .all()

  // Calculate period totals
  let periodIncome = 0
  let periodExpense = 0
  for (const tx of transactions) {
    if (tx.status === 'POSTED') {
      if (tx.transactionType === 'INCOME') periodIncome += tx.amount
      else if (tx.transactionType === 'EXPENSE') periodExpense += tx.amount
    }
  }

  const closingBalance = hasPeriod
    ? openingBalance + periodIncome - periodExpense
    : periodIncome - periodExpense

  return {
    cashBook: book,
    openingBalance,
    periodIncome,
    periodExpense,
    closingBalance,
    transactions,
    totalCount: transactions.length,
  }
}

export async function createManualTransaction(
  data: {
    cashBookId: string
    categoryId?: string | null
    transactionType: 'INCOME' | 'EXPENSE'
    amount: number
    description: string
    transactionDate: string
    receiptFileKey?: string | null
  },
  actor: { id: string; name?: string; role?: string }
) {
  if (data.amount <= 0) {
    throw new Error('Nominal transaksi harus lebih dari 0')
  }
  if (!data.description || data.description.trim().length < 3) {
    throw new Error('Deskripsi transaksi minimal 3 karakter')
  }

  const book = await db
    .select()
    .from(cashBooks)
    .where(eq(cashBooks.id, data.cashBookId))
    .get()
  if (!book) {
    throw new Error('Buku kas tidak ditemukan')
  }

  const txId = 'ctx_' + randomUUID()

  await db.insert(cashTransactions).values({
    id: txId,
    cashBookId: data.cashBookId,
    categoryId: data.categoryId || null,
    transactionType: data.transactionType,
    amount: data.amount,
    description: data.description.trim(),
    transactionDate: data.transactionDate,
    receiptFileKey: data.receiptFileKey || null,
    isLocked: 0,
    status: 'POSTED',
    createdBy: actor.id,
  })

  await logAudit({
    actorUserId: actor.id,
    actorRole: actor.role || 'BENDAHARA',
    module: 'CASH',
    entityType: 'CASH_TRANSACTION',
    entityId: txId,
    action: 'CREATE',
    oldValues: null,
    newValues: {
      cashBookId: data.cashBookId,
      transactionType: data.transactionType,
      amount: data.amount,
      description: data.description,
      transactionDate: data.transactionDate,
    },
  })

  const created = await db
    .select()
    .from(cashTransactions)
    .where(eq(cashTransactions.id, txId))
    .get()
  if (!created) {
    throw new Error('Gagal memuat transaksi kas yang baru dibuat')
  }
  return created
}

export async function updateManualTransaction(
  id: string,
  data: {
    categoryId?: string | null
    amount?: number
    description?: string
    transactionDate?: string
    receiptFileKey?: string | null
  },
  actor: { id: string; name?: string; role?: string }
) {
  const existing = await db
    .select()
    .from(cashTransactions)
    .where(eq(cashTransactions.id, id))
    .get()

  if (!existing) {
    throw new Error('Transaksi kas tidak ditemukan')
  }

  if (existing.isLocked === 1) {
    throw new Error('Transaksi otomatis (terkunci) tidak dapat diubah secara manual')
  }

  if (existing.status === 'VOIDED') {
    throw new Error('Transaksi yang sudah dibatalkan tidak dapat diubah')
  }

  if (data.amount !== undefined && data.amount <= 0) {
    throw new Error('Nominal transaksi harus lebih dari 0')
  }

  const updateFields: any = {
    updatedAt: new Date().toISOString(),
  }

  if (data.categoryId !== undefined) updateFields.categoryId = data.categoryId
  if (data.amount !== undefined) updateFields.amount = data.amount
  if (data.description !== undefined) updateFields.description = data.description.trim()
  if (data.transactionDate !== undefined) updateFields.transactionDate = data.transactionDate
  if (data.receiptFileKey !== undefined) updateFields.receiptFileKey = data.receiptFileKey

  await db
    .update(cashTransactions)
    .set(updateFields)
    .where(eq(cashTransactions.id, id))

  await logAudit({
    actorUserId: actor.id,
    actorRole: actor.role || 'BENDAHARA',
    module: 'CASH',
    entityType: 'CASH_TRANSACTION',
    entityId: id,
    action: 'UPDATE',
    oldValues: {
      amount: existing.amount,
      description: existing.description,
      categoryId: existing.categoryId,
    },
    newValues: updateFields,
  })

  const updated = await db
    .select()
    .from(cashTransactions)
    .where(eq(cashTransactions.id, id))
    .get()
  if (!updated) {
    throw new Error('Gagal memuat transaksi kas setelah pembaruan')
  }
  return updated
}

export async function voidManualTransaction(
  id: string,
  params: { reason: string },
  actor: { id: string; name?: string; role?: string }
) {
  const existing = await db
    .select()
    .from(cashTransactions)
    .where(eq(cashTransactions.id, id))
    .get()

  if (!existing) {
    throw new Error('Transaksi kas tidak ditemukan')
  }

  if (existing.isLocked === 1) {
    throw new Error('Transaksi otomatis (terkunci) tidak dapat dibatalkan di buku kas')
  }

  if (existing.status === 'VOIDED') {
    throw new Error('Transaksi sudah dibatalkan sebelumnya')
  }

  if (!params.reason || params.reason.trim().length < 3) {
    throw new Error('Alasan pembatalan wajib diisi minimal 3 karakter')
  }

  const now = new Date().toISOString()

  await db
    .update(cashTransactions)
    .set({
      status: 'VOIDED',
      voidReason: params.reason.trim(),
      voidedBy: actor.id,
      voidedAt: now,
      updatedAt: now,
    })
    .where(eq(cashTransactions.id, id))

  await logAudit({
    actorUserId: actor.id,
    actorRole: actor.role || 'BENDAHARA',
    module: 'CASH',
    entityType: 'CASH_TRANSACTION',
    entityId: id,
    action: 'VOID',
    oldValues: { status: 'POSTED', amount: existing.amount },
    newValues: { status: 'VOIDED', voidReason: params.reason },
    reason: params.reason,
  })
}
