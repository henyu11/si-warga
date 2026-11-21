import { describe, it, expect } from 'vitest'
import { db } from '@/db'
import { users } from '@/db/schema'
import { GET, DELETE, PATCH } from '@/app/api/v1/audit-logs/route'
import { logAudit } from '@/server/services/audit.service'
import { eq } from 'drizzle-orm'

describe('Audit Trail API & Immutability (F-009)', () => {
  it('returns paginated audit logs with user info and supports module filter', async () => {
    const adminUser = await db
      .select()
      .from(users)
      .where(eq(users.role, 'ADMIN'))
      .get()

    // Insert known audit entry
    await logAudit({
      actorUserId: adminUser!.id,
      actorRole: 'ADMIN',
      module: 'TEST_MODULE',
      entityType: 'TEST_ENTITY',
      entityId: 'ent-123',
      action: 'CREATE',
      oldValues: null,
      newValues: { test: true },
      reason: 'Testing audit log query',
    })

    const req = new Request('http://localhost:3000/api/v1/audit-logs?module=TEST_MODULE')
    const res = await GET(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data.logs)).toBe(true)
    expect(json.data.logs.length).toBeGreaterThan(0)

    const first = json.data.logs[0]
    expect(first.module).toBe('TEST_MODULE')
    expect(first.actorFullName).toBeDefined()
    expect(first.action).toBe('CREATE')
  })

  it('rejects DELETE and PATCH methods with 405 to guarantee immutable ledger', async () => {
    const delRes = await DELETE()
    expect(delRes.status).toBe(405)

    const patchRes = await PATCH()
    expect(patchRes.status).toBe(405)
  })
})
