import { describe, it, expect } from 'vitest'
import { recordPayment, voidPayment } from '@/server/services/payment.service'
import { generateMonthlyBills, listBills, getBillDetail } from '@/server/services/billing.service'
import { createHousehold } from '@/server/services/household.service'
import { db } from '@/db'
import { cashTransactions, cashBooks } from '@/db/schema'
import { eq } from 'drizzle-orm'

describe('Payment Service & Dual Cash Routing (F-005)', () => {
  const actor = { id: 'u-bendahara-01', role: 'BENDAHARA' }

  it('records payment and routes Iuran Wajib to Kas Umum & Keamanan to Kas Keamanan', async () => {
    // 1. Create a dedicated household and bill
    const hh = await createHousehold(
      {
        blockNumber: `Blok Pay-${Date.now().toString().slice(-4)}`,
        headName: 'Keluarga Bayar Dual Kas',
        phoneWa: '081233445566',
        isBillingActive: 1,
      },
      actor
    )

    await generateMonthlyBills({
      year: 2026,
      month: 12,
      dueDate: '2026-12-10',
      actor,
    })

    const billList = await listBills({ year: 2026, month: 12, search: hh.headName })
    const bill = billList.find((b) => b.householdId === hh.id)!
    expect(bill).toBeDefined()

    const wajibItem = bill.items.find((i) => i.itemType === 'IURAN_WAJIB')!
    const keamananItem = bill.items.find((i) => i.itemType === 'IURAN_KEAMANAN')!

    expect(wajibItem).toBeDefined()
    expect(keamananItem).toBeDefined()

    // 2. Record full payment for both items
    const payment = await recordPayment(
      {
        billId: bill.id,
        paymentMethod: 'TRANSFER',
        notes: 'Transfer via BCA m-banking',
        allocations: [
          { billItemId: wajibItem.id, amount: wajibItem.amountDue },
          { billItemId: keamananItem.id, amount: keamananItem.amountDue },
        ],
      },
      actor
    )

    expect(payment.id).toBeDefined()
    expect(payment.paidAmount).toBe(wajibItem.amountDue + keamananItem.amountDue)

    // 3. Verify Bill status is now PAID
    const updatedBill = await getBillDetail(bill.id)
    expect(updatedBill?.status).toBe('PAID')

    // 4. Verify Dual Cash Transactions generated and locked
    const txList = await db
      .select()
      .from(cashTransactions)
      .where(eq(cashTransactions.paymentId, payment.id))
      .all()

    expect(txList.length).toBe(2)

    // Check Kas Umum transaction
    const umumBook = await db
      .select()
      .from(cashBooks)
      .where(eq(cashBooks.bookType, 'KAS_UMUM'))
      .get()
    const umumTx = txList.find((t) => t.cashBookId === umumBook?.id)
    expect(umumTx).toBeDefined()
    expect(umumTx?.amount).toBe(wajibItem.amountDue)
    expect(umumTx?.isLocked).toBe(1)
    expect(umumTx?.status).toBe('POSTED')

    // Check Kas Keamanan transaction
    const keamananBook = await db
      .select()
      .from(cashBooks)
      .where(eq(cashBooks.bookType, 'KAS_KEAMANAN'))
      .get()
    const keamananTx = txList.find((t) => t.cashBookId === keamananBook?.id)
    expect(keamananTx).toBeDefined()
    expect(keamananTx?.amount).toBe(keamananItem.amountDue)
    expect(keamananTx?.isLocked).toBe(1)
    expect(keamananTx?.status).toBe('POSTED')
  })

  it('voids payment atomically and reverts cash transactions and bill status', async () => {
    // 1. Create household and bill
    const hh = await createHousehold(
      {
        blockNumber: `Blok Void-${Date.now().toString().slice(-4)}`,
        headName: 'Keluarga Void Test',
        phoneWa: '081299001122',
        isBillingActive: 1,
      },
      actor
    )

    await generateMonthlyBills({
      year: 2026,
      month: 12,
      dueDate: '2026-12-10',
      actor,
    })

    const bills = await listBills({ year: 2026, month: 12 })
    const targetBill = bills.find((b) => b.householdId === hh.id)!
    expect(targetBill).toBeDefined()

    // 2. Record payment
    const payment = await recordPayment(
      {
        billId: targetBill.id,
        paymentMethod: 'TUNAI',
        notes: 'Bayar tunai titip satpam',
        allocations: targetBill.items.map((i) => ({
          billItemId: i.id,
          amount: i.amountDue,
        })),
      },
      actor
    )

    // Verify status was PAID
    const paidBill = await getBillDetail(targetBill.id)
    expect(paidBill?.status).toBe('PAID')

    // 3. Void the payment
    await voidPayment(
      payment.id,
      { reason: 'Salah catat nominal oleh bendahara' },
      actor
    )

    // 4. Verify cash transactions are VOIDED
    const voidedTxs = await db
      .select()
      .from(cashTransactions)
      .where(eq(cashTransactions.paymentId, payment.id))
      .all()

    expect(voidedTxs.every((t) => t.status === 'VOIDED')).toBe(true)

    // 5. Verify bill status is back to UNPAID
    const revertedBill = await getBillDetail(targetBill.id)
    expect(revertedBill?.status).toBe('UNPAID')
    expect(revertedBill?.totalPaid).toBe(0)
  })
})
