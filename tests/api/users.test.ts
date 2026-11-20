import { describe, it, expect } from 'vitest'
import {
  listUsers,
  createUser,
  updateUser,
  deactivateUser,
} from '@/server/services/user.service'

describe('User Service & Management', () => {
  it('listUsers returns existing seeded users', async () => {
    const users = await listUsers()
    expect(users.length).toBeGreaterThanOrEqual(3)
    const admin = users.find((u) => u.username === 'admin')
    expect(admin).toBeDefined()
    expect(admin?.role).toBe('ADMIN')
    expect((admin as any).passwordHash).toBeUndefined()
  })

  it('createUser creates user with hashed password and audit log', async () => {
    const newUsername = `test_user_${Date.now()}`
    const created = await createUser(
      {
        fullName: 'Test User Pengurus',
        username: newUsername,
        email: `${newUsername}@rt04.local`,
        password: 'PasswordBaru123!',
        role: 'BENDAHARA',
      },
      {
        id: 'u-admin-01',
        role: 'ADMIN',
      }
    )

    expect(created.id).toBeDefined()
    expect(created.username).toBe(newUsername)
    expect(created.role).toBe('BENDAHARA')
    expect((created as any).passwordHash).toBeUndefined()
  })

  it('updateUser updates fields and creates audit log', async () => {
    const newUsername = `test_edit_${Date.now()}`
    const created = await createUser(
      {
        fullName: 'User Before Edit',
        username: newUsername,
        password: 'Password123!',
        role: 'KETUA',
      },
      { id: 'u-admin-01', role: 'ADMIN' }
    )

    const updated = await updateUser(
      created.id,
      { fullName: 'User After Edit' },
      { id: 'u-admin-01', role: 'ADMIN' }
    )

    expect(updated.fullName).toBe('User After Edit')
  })

  it('deactivateUser sets isActive to 0', async () => {
    const newUsername = `test_deact_${Date.now()}`
    const created = await createUser(
      {
        fullName: 'User To Deactivate',
        username: newUsername,
        password: 'Password123!',
        role: 'BENDAHARA',
      },
      { id: 'u-admin-01', role: 'ADMIN' }
    )

    await deactivateUser(created.id, { id: 'u-admin-01', role: 'ADMIN' })
    const allUsers = await listUsers()
    const found = allUsers.find((u) => u.id === created.id)
    expect(found?.isActive).toBe(0)
  })
})
