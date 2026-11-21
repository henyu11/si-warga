import { describe, it, expect } from 'vitest'
import {
  getActiveFeeRates,
  createFeeRate,
  getAppSettings,
  updateAppSettings,
} from '@/server/services/settings.service'
import { db } from '@/db'
import { bills, billItems, households, feeRates } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

describe('Settings & Fee Rates Service', () => {
  it('getActiveFeeRates returns currently active rates', async () => {
    const rates = await getActiveFeeRates()
    expect(rates.IURAN_WAJIB).toBeDefined()
    expect(rates.IURAN_KEAMANAN).toBeDefined()
    expect(rates.DENDA_RONDA).toBeDefined()
    expect(rates.IURAN_WAJIB.amount).toBeGreaterThan(0)
  })

  it('createFeeRate deactivates old rate and creates new one with audit log', async () => {
    const actor = { id: 'u-admin-01', role: 'ADMIN' }
    const result = await createFeeRate(
      {
        feeType: 'IURAN_WAJIB',
        amount: 60000,
        effectiveFrom: '2026-12-01',
        changeReason: 'Penyesuaian hasil rapat warga perumahan',
        applyToUnpaidCurrentMonth: false,
      },
      actor
    )

    expect(result.feeRate.amount).toBe(60000)
    expect(result.feeRate.isActive).toBe(1)

    // Check old rate is now inactive
    const oldRates = await db
      .select()
      .from(feeRates)
      .where(and(eq(feeRates.feeType, 'IURAN_WAJIB'), eq(feeRates.amount, 50000)))
      .all()
    expect(oldRates.some((r) => r.isActive === 0)).toBe(true)
  })

  it('createFeeRate with applyToUnpaidCurrentMonth=true updates only UNPAID items', async () => {
    const actor = { id: 'u-admin-01', role: 'ADMIN' }
    const hhId = `hh-test-${Date.now()}`

    // Insert dummy household and bill for testing
    await db.insert(households).values({
      id: hhId,
      blockNumber: `Blok RateTest-${Date.now().toString().slice(-4)}`,
      headName: 'Keluarga Uji Tarif',
      phoneWa: '62811223344',
      occupancyStatus: 'TETAP',
    })

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    const billId = `bill-test-${Date.now()}`

    await db.insert(bills).values({
      id: billId,
      householdId: hhId,
      periodYear: currentYear,
      periodMonth: currentMonth,
      dueDate: `${currentYear}-${String(currentMonth).padStart(2, '0')}-10`,
      generatedBy: actor.id,
      status: 'PARTIAL',
    })

    // 1 item PAID, 1 item UNPAID
    const paidItemId = `item-paid-${Date.now()}`
    const unpaidItemId = `item-unpaid-${Date.now()}`

    await db.insert(billItems).values([
      {
        id: paidItemId,
        billId,
        itemType: 'IURAN_KEAMANAN',
        amountDue: 40000,
        amountPaid: 40000,
        status: 'PAID',
      },
      {
        id: unpaidItemId,
        billId,
        itemType: 'IURAN_KEAMANAN',
        amountDue: 40000,
        amountPaid: 0,
        status: 'UNPAID',
      },
    ])

    // Update IURAN_KEAMANAN to 45000
    await createFeeRate(
      {
        feeType: 'IURAN_KEAMANAN',
        amount: 45000,
        effectiveFrom: `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
        changeReason: 'Kenaikan iuran pos satpam',
        applyToUnpaidCurrentMonth: true,
      },
      actor
    )

    // Verify: PAID item untouched, UNPAID item updated to 45000
    const paidItem = await db.select().from(billItems).where(eq(billItems.id, paidItemId)).get()
    const unpaidItem = await db.select().from(billItems).where(eq(billItems.id, unpaidItemId)).get()

    expect(paidItem?.amountDue).toBe(40000)
    expect(unpaidItem?.amountDue).toBe(45000)
  })

  it('getAppSettings and updateAppSettings work correctly', async () => {
    const actor = { id: 'u-admin-01', role: 'ADMIN' }
    const settings = await getAppSettings()
    expect(settings.rekening_kas_umum).toBeDefined()

    await updateAppSettings(
      { rekening_kas_umum: 'BCA 99998888 a.n. Bendahara RT 04' },
      actor
    )

    const updated = await getAppSettings()
    expect(updated.rekening_kas_umum).toBe('BCA 99998888 a.n. Bendahara RT 04')
  })
})
