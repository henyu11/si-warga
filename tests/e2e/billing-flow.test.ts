import { describe, it, expect } from 'vitest'
import { db } from '@/db'
import { households, feeRates, bills, billItems, cashBooks, cashTransactions, payments } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { generateMonthlyBills } from '@/server/services/billing.service'
import { recordPayment, voidPayment } from '@/server/services/payment.service'
import { getCashBooksSummary } from '@/server/services/cash.service'
import { listArrears } from '@/server/services/arrears.service'

describe('End-to-End Billing & Dual-Cash Cycle Flow', () => {
  it('executes full cycle: generate bills -> record payment -> automatic dual-kas routing -> void reversal', async () => {
    const testYear = 2028
    const testMonth = 3

    // 1. Generate monthly bills
    const genResult = await generateMonthlyBills({
      year: testYear,
      month: testMonth,
      dueDate: `${testYear}-03-10`,
      actor: {
        id: 'u-admin-01',
        role: 'ADMIN',
      },
    })
    expect(genResult.createdCount + genResult.skippedCount).toBeGreaterThan(0)

    // 2. Select first unpaid bill
    const sampleBill = await db
      .select({
        id: bills.id,
        householdId: bills.householdId,
        status: bills.status,
      })
      .from(bills)
      .where(and(eq(bills.periodMonth, testMonth), eq(bills.periodYear, testYear)))
      .get()

    expect(sampleBill).toBeDefined()
    expect(sampleBill!.status).toBe('UNPAID')

    // Check arrears listing includes this bill
    const initialArrears = await listArrears({ year: testYear, month: testMonth })
    expect(initialArrears.some((a) => a.billId === sampleBill!.id)).toBe(true)

    // Initial cash balance
    const initialCash = await getCashBooksSummary()
    const initialUmumBalance = initialCash.kasUmum.balance
    const initialKeamananBalance = initialCash.kasKeamanan.balance

    // 3. Record payment for this bill (full payment: Rp 90.000)
    // Automatic routing: Rp 50.000 to Kas Umum, Rp 40.000 to Kas Keamanan
    const bItems = await db
      .select()
      .from(billItems)
      .where(eq(billItems.billId, sampleBill!.id))
      .all()

    const payment = await recordPayment(
      {
        billId: sampleBill!.id,
        paymentMethod: 'TRANSFER',
        allocations: bItems.map((item) => ({
          billItemId: item.id,
          amount: item.amountDue,
        })),
        notes: 'Bayar lunas via BCA transfer',
        receiptFileKey: 'receipts/test-payment-e2e.jpg',
      },
      {
        id: 'u-bendahara-01',
        role: 'BENDAHARA',
      }
    )

    const totalExpected = bItems.reduce((s, i) => s + i.amountDue, 0)
    const wajibTotal = bItems
      .filter((i) => i.itemType === 'IURAN_WAJIB')
      .reduce((s, i) => s + i.amountDue, 0)
    const keamananTotal = bItems
      .filter((i) => i.itemType === 'IURAN_KEAMANAN' || i.itemType === 'DENDA_RONDA')
      .reduce((s, i) => s + i.amountDue, 0)

    expect(payment.id).toBeDefined()
    expect(payment.paidAmount).toBe(totalExpected)

    // Verify bill status updated to PAID
    const updatedBill = await db
      .select()
      .from(bills)
      .where(eq(bills.id, sampleBill!.id))
      .get()
    expect(updatedBill?.status).toBe('PAID')

    // Verify automatic dual-kas routing
    const updatedCash = await getCashBooksSummary()
    expect(updatedCash.kasUmum.balance).toBe(initialUmumBalance + wajibTotal)
    expect(updatedCash.kasKeamanan.balance).toBe(initialKeamananBalance + keamananTotal)

    // Check arrears listing: this bill should no longer appear
    const updatedArrears = await listArrears({ year: testYear, month: testMonth })
    expect(updatedArrears.some((a) => a.billId === sampleBill!.id)).toBe(false)

    // 4. Void payment and verify atomic reversal
    await voidPayment(
      payment.id,
      { reason: 'Warga salah kirim slip transfer' },
      { id: 'u-bendahara-01', role: 'BENDAHARA' }
    )

    // Bill reverts back to UNPAID
    const revertedBill = await db
      .select()
      .from(bills)
      .where(eq(bills.id, sampleBill!.id))
      .get()
    expect(revertedBill?.status).toBe('UNPAID')

    // Cash balances revert back
    const revertedCash = await getCashBooksSummary()
    expect(revertedCash.kasUmum.balance).toBe(initialUmumBalance)
    expect(revertedCash.kasKeamanan.balance).toBe(initialKeamananBalance)
  })
})
