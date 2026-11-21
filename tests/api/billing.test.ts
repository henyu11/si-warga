import { describe, it, expect } from 'vitest'
import {
  generateMonthlyBills,
  listBills,
  getBillDetail,
  addFineToBill,
  overrideBillItem,
} from '@/server/services/billing.service'
import { createHousehold } from '@/server/services/household.service'
import { db } from '@/db'
import { bills, billItems } from '@/db/schema'
import { eq } from 'drizzle-orm'

describe('Billing Service (F-004)', () => {
  const actor = { id: 'u-admin-01', role: 'ADMIN' }

  it('generates bills idempotently and skips existing bills', async () => {
    // Ensure at least 1 active household
    await createHousehold(
      {
        blockNumber: `Blok Gen-${Date.now().toString().slice(-4)}`,
        headName: 'Keluarga Siap Tagih',
        phoneWa: '081299988811',
        isBillingActive: 1,
      },
      actor
    )

    const testYear = 2026
    const testMonth = 11

    // First run: should create
    const res1 = await generateMonthlyBills({
      year: testYear,
      month: testMonth,
      dueDate: '2026-11-10',
      actor,
    })

    expect(res1.createdCount).toBeGreaterThan(0)
    expect(res1.appliedRates.IURAN_WAJIB).toBeGreaterThan(0)
    expect(res1.appliedRates.IURAN_KEAMANAN).toBeGreaterThan(0)

    // Second run: same month and year must be idempotent (0 created, skippedCount > 0)
    const res2 = await generateMonthlyBills({
      year: testYear,
      month: testMonth,
      dueDate: '2026-11-10',
      actor,
    })

    expect(res2.createdCount).toBe(0)
    expect(res2.skippedCount).toBeGreaterThanOrEqual(res1.createdCount)
  })

  it('addFineToBill adds DENDA_RONDA item and updates bill status', async () => {
    const list = await listBills({ year: 2026, month: 11 })
    expect(list.length).toBeGreaterThan(0)
    const targetBill = list[0]

    const fineItem = await addFineToBill({
      billId: targetBill.id,
      fineDate: '2026-11-05',
      fineNote: 'Tidak hadir jadwal ronda malam pos 1',
      actor,
    })

    expect(fineItem.itemType).toBe('DENDA_RONDA')
    expect(fineItem.amountDue).toBe(25000)
    expect(fineItem.status).toBe('UNPAID')

    // Verify detail reflects the new fine item
    const detail = await getBillDetail(targetBill.id)
    expect(detail?.items.some((i) => i.id === fineItem.id)).toBe(true)
  })

  it('overrideBillItem updates amount_due with audit reason', async () => {
    const list = await listBills({ year: 2026, month: 11 })
    const targetBill = list[0]
    const detail = await getBillDetail(targetBill.id)
    const targetItem = detail!.items[0]

    const updatedItem = await overrideBillItem({
      itemId: targetItem.id,
      amountDue: 35000,
      reason: 'Diskon khusus warga lansia musyawarah RT',
      actor,
    })

    expect(updatedItem.amountDue).toBe(35000)
    expect(updatedItem.overrideReason).toContain('Diskon khusus warga lansia')
  })
})
