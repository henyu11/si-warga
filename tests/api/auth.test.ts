import { describe, it, expect } from 'vitest'
import { hashPassword, comparePassword } from '@/lib/password'
import { signJwt, verifyJwt } from '@/lib/auth'
import { loginUser } from '@/server/services/auth.service'

describe('Auth helpers', () => {
  it('hashPassword and comparePassword work correctly', async () => {
    const hash = await hashPassword('TestPass123!')
    expect(await comparePassword('TestPass123!', hash)).toBe(true)
    expect(await comparePassword('wrong', hash)).toBe(false)
  })

  it('signJwt and verifyJwt roundtrip', async () => {
    const token = await signJwt({ userId: 'u-001', role: 'ADMIN' })
    const payload = await verifyJwt(token)
    expect(payload?.userId).toBe('u-001')
    expect(payload?.role).toBe('ADMIN')
  })

  it('verifyJwt returns null for invalid token', async () => {
    const payload = await verifyJwt('invalid.token.here')
    expect(payload).toBeNull()
  })
})

describe('Auth Service', () => {
  it('loginUser succeeds with valid seeded credentials', async () => {
    const result = await loginUser('admin', 'Admin123!')
    expect('user' in result).toBe(true)
    if ('user' in result) {
      expect(result.user.username).toBe('admin')
      expect(result.user.role).toBe('ADMIN')
      expect(result.token).toBeDefined()
    }
  })

  it('loginUser fails with wrong password', async () => {
    const result = await loginUser('admin', 'WrongPass123!')
    expect('error' in result).toBe(true)
  })

  it('loginUser fails with non-existent user', async () => {
    const result = await loginUser('ghost_user', 'AnyPass123!')
    expect('error' in result).toBe(true)
  })
})
