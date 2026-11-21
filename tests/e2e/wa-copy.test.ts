import { describe, it, expect } from 'vitest'
import { listArrears, buildRekapTunggakanText } from '@/server/services/arrears.service'

describe('WhatsApp Billing Notification E2E Verification', () => {
  it('generates valid WhatsApp chat message and group broadcast summary for unpaid warga', async () => {
    const arrears = await listArrears({ year: 2026, month: 11 })
    expect(arrears.length).toBeGreaterThan(0)

    const firstItem = arrears[0]
    expect(firstItem.waMessageText).toBeDefined()
    expect(firstItem.waMessageText).toContain(firstItem.headName)
    expect(firstItem.waMessageText).toContain(firstItem.blockNumber)
    expect(firstItem.waLink).toContain('https://wa.me/')

    const groupRekap = buildRekapTunggakanText(arrears, 'Periode November 2026')
    expect(groupRekap).toContain('REKAP TUNGGAKAN IURAN RT 04')
    expect(groupRekap).toContain(firstItem.headName)
    expect(groupRekap).toContain(firstItem.blockNumber)
  })
})
