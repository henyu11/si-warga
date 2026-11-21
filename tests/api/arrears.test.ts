import { describe, it, expect } from 'vitest'
import { listArrears, formatWaBillingMessage } from '@/server/services/arrears.service'

describe('Arrears & WhatsApp Billing Service (F-006)', () => {
  it('listArrears only returns UNPAID or PARTIAL bills', async () => {
    const arrears = await listArrears({ year: 2026, month: 11 })
    expect(arrears.length).toBeGreaterThan(0)
    expect(arrears.every((a) => a.billStatus !== 'PAID')).toBe(true)
  })

  it('formatWaBillingMessage substitutes placeholders correctly', () => {
    const text = formatWaBillingMessage({
      template:
        'Yth. Bpk/Ibu *{nama}* ({blok})\nTotal: {total}\nRek: {rekening}',
      headName: 'Suryono',
      blockNumber: 'A1/02',
      periodStr: 'November 2026',
      wajibAmount: 50000,
      keamananAmount: 40000,
      dendaAmount: 0,
      totalRemaining: 90000,
      rekeningInfo: 'BCA 1234567890 a.n. Kas RT 04',
    })

    expect(text).toContain('Suryono')
    expect(text).toContain('A1/02')
    expect(text).toContain('Rp 90.000')
    expect(text).toContain('BCA 1234567890')
  })

  it('each arrear item includes waMessageText and encoded waLink', async () => {
    const arrears = await listArrears({ year: 2026, month: 11 })
    const item = arrears[0]

    expect(item.waMessageText).toBeDefined()
    expect(item.waMessageText.length).toBeGreaterThan(10)
    expect(item.waLink).toContain('https://wa.me/')
    expect(item.waLink).toContain(item.phoneWa)
  })
})
