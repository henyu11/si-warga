import { describe, it, expect, beforeAll } from 'vitest'
import { db } from '@/db'
import { cashBooks, cashCategories, cashTransactions, users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import {
  getCashBooksSummary,
  listTransactions,
  createManualTransaction,
  updateManualTransaction,
  voidManualTransaction,
} from '@/server/services/cash.service'

describe('Dual Buku Kas Service (F-007)', () => {
  let kasUmumBook: any
  let kasKeamananBook: any
  let defaultCategory: any
  let bendaharaUser: any

  beforeAll(async () => {
    kasUmumBook = await db
      .select()
      .from(cashBooks)
      .where(eq(cashBooks.bookType, 'KAS_UMUM'))
      .get()

    kasKeamananBook = await db
      .select()
      .from(cashBooks)
      .where(eq(cashBooks.bookType, 'KAS_KEAMANAN'))
      .get()

    defaultCategory = await db
      .select()
      .from(cashCategories)
      .where(eq(cashCategories.cashBookId, kasUmumBook.id))
      .get()

    bendaharaUser = await db
      .select()
      .from(users)
      .where(eq(users.role, 'BENDAHARA'))
      .get()
  })

  it('getCashBooksSummary returns balance and categories for both books', async () => {
    const summary = await getCashBooksSummary()
    expect(summary.kasUmum).toBeDefined()
    expect(summary.kasKeamanan).toBeDefined()
    expect(summary.kasUmum.bookType).toBe('KAS_UMUM')
    expect(summary.kasKeamanan.bookType).toBe('KAS_KEAMANAN')
    expect(typeof summary.kasUmum.balance).toBe('number')
    expect(typeof summary.kasKeamanan.balance).toBe('number')
    expect(Array.isArray(summary.kasUmum.categories)).toBe(true)
  })

  it('creates manual income and expense transaction and updates balance', async () => {
    const initialSummary = await getCashBooksSummary()
    const initialBalance = initialSummary.kasUmum.balance

    // Create income
    const incomeTx = await createManualTransaction(
      {
        cashBookId: kasUmumBook.id,
        categoryId: defaultCategory?.id,
        transactionType: 'INCOME',
        amount: 250000,
        description: 'Sumbangan warga gotong royong',
        transactionDate: '2026-11-20',
      },
      bendaharaUser
    )

    expect(incomeTx).toBeDefined()
    expect(incomeTx!.id).toBeDefined()
    expect(incomeTx!.amount).toBe(250000)
    expect(incomeTx!.isLocked).toBe(0)
    expect(incomeTx!.status).toBe('POSTED')

    // Create expense
    const expenseTx = await createManualTransaction(
      {
        cashBookId: kasUmumBook.id,
        categoryId: defaultCategory?.id,
        transactionType: 'EXPENSE',
        amount: 50000,
        description: 'Beli sapu dan plastik sampah',
        transactionDate: '2026-11-21',
      },
      bendaharaUser
    )

    expect(expenseTx).toBeDefined()
    expect(expenseTx!.id).toBeDefined()
    expect(expenseTx!.amount).toBe(50000)

    const updatedSummary = await getCashBooksSummary()
    expect(updatedSummary.kasUmum.balance).toBe(initialBalance + 250000 - 50000)
  })

  it('cannot edit or void a locked cash transaction (is_locked=1)', async () => {
    // Insert a locked tx (like one routed from payment)
    const lockedTxId = 'test-locked-tx-' + Date.now()
    await db.insert(cashTransactions).values({
      id: lockedTxId,
      cashBookId: kasUmumBook.id,
      transactionType: 'INCOME',
      amount: 100000,
      description: 'Auto routing locked iuran',
      transactionDate: '2026-11-20',
      isLocked: 1,
      status: 'POSTED',
      createdBy: bendaharaUser.id,
    })

    // Attempt update
    await expect(
      updateManualTransaction(
        lockedTxId,
        { description: 'Changed description' },
        bendaharaUser
      )
    ).rejects.toThrow('Transaksi otomatis (terkunci) tidak dapat diubah secara manual')

    // Attempt void
    await expect(
      voidManualTransaction(
        lockedTxId,
        { reason: 'Coba batalkan' },
        bendaharaUser
      )
    ).rejects.toThrow('Transaksi otomatis (terkunci) tidak dapat dibatalkan di buku kas')
  })

  it('can update and void unlocked manual transactions', async () => {
    // Create manual tx
    const tx = await createManualTransaction(
      {
        cashBookId: kasKeamananBook.id,
        transactionType: 'EXPENSE',
        amount: 75000,
        description: 'Beli senter pos ronda',
        transactionDate: '2026-11-21',
      },
      bendaharaUser
    )

    // Update
    const updated = await updateManualTransaction(
      tx!.id,
      { amount: 80000, description: 'Beli 2 senter pos ronda' },
      bendaharaUser
    )
    expect(updated).toBeDefined()
    expect(updated!.amount).toBe(80000)
    expect(updated!.description).toBe('Beli 2 senter pos ronda')

    // Void
    await voidManualTransaction(
      tx!.id,
      { reason: 'Salah input nota' },
      bendaharaUser
    )

    const voidedTx = await db
      .select()
      .from(cashTransactions)
      .where(eq(cashTransactions.id, tx!.id))
      .get()

    expect(voidedTx?.status).toBe('VOIDED')
    expect(voidedTx?.voidReason).toBe('Salah input nota')
  })

  it('listTransactions returns opening balance, transactions, and closing balance for period', async () => {
    const result = await listTransactions({
      bookType: 'KAS_UMUM',
      year: 2026,
      month: 11,
    })

    expect(result).toHaveProperty('openingBalance')
    expect(result).toHaveProperty('transactions')
    expect(result).toHaveProperty('closingBalance')
    expect(Array.isArray(result.transactions)).toBe(true)
  })
})
