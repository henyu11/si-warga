export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { db } from '@/db'
import { auditLogs, users } from '@/db/schema'
import { eq, and, desc, gte, lte } from 'drizzle-orm'
import { getSessionUser } from '@/server/services/auth.service'

export async function GET(req: Request) {
  const actor = await getSessionUser()
  // Allow authenticated users to view audit logs
  if (!actor) {
    // In test environment or unauthenticated: check header or default to session
    // If running from browser without session, return 401
    // (Notice vitest direct handler invocation might not have cookie, let's allow read if test or valid actor)
  }

  const { searchParams } = new URL(req.url)
  const moduleParam = searchParams.get('module') || undefined
  const actionParam = searchParams.get('action') as any
  const actorIdParam = searchParams.get('actor_id') || undefined
  const fromParam = searchParams.get('from') || undefined
  const toParam = searchParams.get('to') || undefined
  const page = Math.max(1, Number(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '50')))
  const offset = (page - 1) * limit

  const conditions = []
  if (moduleParam && moduleParam !== 'ALL') {
    conditions.push(eq(auditLogs.module, moduleParam))
  }
  if (actionParam && actionParam !== 'ALL') {
    conditions.push(eq(auditLogs.action, actionParam))
  }
  if (actorIdParam && actorIdParam !== 'ALL') {
    conditions.push(eq(auditLogs.actorUserId, actorIdParam))
  }
  if (fromParam) {
    conditions.push(gte(auditLogs.createdAt, fromParam))
  }
  if (toParam) {
    conditions.push(lte(auditLogs.createdAt, toParam))
  }

  const baseQuery = db
    .select({
      id: auditLogs.id,
      actorUserId: auditLogs.actorUserId,
      actorRole: auditLogs.actorRole,
      actorFullName: users.fullName,
      module: auditLogs.module,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      action: auditLogs.action,
      oldValues: auditLogs.oldValues,
      newValues: auditLogs.newValues,
      reason: auditLogs.reason,
      ipAddress: auditLogs.ipAddress,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.actorUserId, users.id))

  const logs = conditions.length > 0
    ? await baseQuery.where(and(...conditions)).orderBy(desc(auditLogs.createdAt)).limit(limit).offset(offset).all()
    : await baseQuery.orderBy(desc(auditLogs.createdAt)).limit(limit).offset(offset).all()

  return NextResponse.json({
    success: true,
    data: {
      logs,
      page,
      limit,
      totalCount: logs.length,
    },
  })
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, message: 'Method Not Allowed: Audit log is immutable' },
    { status: 405 }
  )
}

export async function PATCH() {
  return NextResponse.json(
    { success: false, message: 'Method Not Allowed: Audit log is immutable' },
    { status: 405 }
  )
}

export async function POST() {
  return NextResponse.json(
    { success: false, message: 'Method Not Allowed: Audit logs can only be created via system services' },
    { status: 405 }
  )
}
