import { describe, it, expect } from 'vitest'
import {
  normalizePhoneWa,
  createHousehold,
  listHouseholds,
  updateHousehold,
  softDeleteHousehold,
  getHouseholdById,
} from '@/server/services/household.service'

describe('Household Service & Data Warga', () => {
  it('normalizePhoneWa formats numbers correctly to 628xxx', () => {
    expect(normalizePhoneWa('08123456789')).toBe('628123456789')
    expect(normalizePhoneWa('+628123456789')).toBe('628123456789')
    expect(normalizePhoneWa('628123456789')).toBe('628123456789')
    expect(normalizePhoneWa('0812-3456-7890')).toBe('6281234567890')
  })

  it('createHousehold saves household with normalized WA and audit log', async () => {
    const blockNumber = `Blok A${Date.now().toString().slice(-4)}`
    const created = await createHousehold(
      {
        blockNumber,
        headName: 'Bambang Sudarsono',
        phoneWa: '081399887766',
        occupancyStatus: 'TETAP',
        isBillingActive: 1,
        notes: 'Dekat pos satpam',
      },
      { id: 'u-admin-01', role: 'ADMIN' }
    )

    expect(created.id).toBeDefined()
    expect(created.phoneWa).toBe('6281399887766')
    expect(created.blockNumber).toBe(blockNumber)
    expect(created.isBillingActive).toBe(1)
  })

  it('updateHousehold updates details and audit log', async () => {
    const blockNumber = `Blok B${Date.now().toString().slice(-4)}`
    const created = await createHousehold(
      {
        blockNumber,
        headName: 'Warga Pindah',
        phoneWa: '0855112233',
        occupancyStatus: 'KONTRAK',
      },
      { id: 'u-admin-01', role: 'ADMIN' }
    )

    const updated = await updateHousehold(
      created.id,
      {
        headName: 'Warga Pengganti',
        occupancyStatus: 'TETAP',
      },
      { id: 'u-admin-01', role: 'ADMIN' }
    )

    expect(updated.headName).toBe('Warga Pengganti')
    expect(updated.occupancyStatus).toBe('TETAP')
  })

  it('softDeleteHousehold sets deletedAt and excludes from active list', async () => {
    const blockNumber = `Blok C${Date.now().toString().slice(-4)}`
    const created = await createHousehold(
      {
        blockNumber,
        headName: 'Warga Keluar',
        phoneWa: '0877112233',
      },
      { id: 'u-admin-01', role: 'ADMIN' }
    )

    await softDeleteHousehold(created.id, { id: 'u-admin-01', role: 'ADMIN' })

    const activeList = await listHouseholds({})
    expect(activeList.some((h) => h.id === created.id)).toBe(false)

    const single = await getHouseholdById(created.id)
    expect(single?.deletedAt).not.toBeNull()
  })
})
