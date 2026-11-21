import { describe, it, expect } from 'vitest'
import { getDashboardData } from '@/server/services/dashboard.service'

describe('Dashboard Dual-Kas & WA Report (F-008)', () => {
  it('getDashboardData returns dual cash summary, payment ratio, and 6-month chart data', async () => {
    const data = await getDashboardData(11, 2026)

    expect(data).toHaveProperty('kasUmum')
    expect(data).toHaveProperty('kasKeamanan')
    expect(data).toHaveProperty('totalBalance')
    expect(data.totalBalance).toBe(data.kasUmum.balance + data.kasKeamanan.balance)

    expect(data).toHaveProperty('paymentRatio')
    expect(data.paymentRatio).toHaveProperty('paid')
    expect(data.paymentRatio).toHaveProperty('total')
    expect(data.paymentRatio).toHaveProperty('percentage')
    expect(data.paymentRatio).toHaveProperty('totalArrearsAmount')

    expect(data).toHaveProperty('monthlyChartData')
    expect(Array.isArray(data.monthlyChartData)).toBe(true)
    expect(data.monthlyChartData.length).toBe(6)

    expect(data).toHaveProperty('waReportText')
    expect(data.waReportText).toContain('KAS UMUM')
    expect(data.waReportText).toContain('KAS KEAMANAN')
    expect(data.waReportText).toContain('TOTAL KAS GABUNGAN')
  })
})
