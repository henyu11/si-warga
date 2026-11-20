import { db } from '@/db'
import { auditLogs } from '@/db/schema'

export interface LogAuditParams {
  actorUserId: string
  actorRole: string
  module: string
  entityType: string
  entityId: string
  action: 'CREATE' | 'UPDATE' | 'RATE_CHANGE' | 'OVERRIDE' | 'VOID' | 'SOFT_DELETE'
  oldValues?: object | null
  newValues?: object | null
  reason?: string | null
  ipAddress?: string | null
}

export async function logAudit(params: LogAuditParams, txDb = db): Promise<void> {
  await txDb.insert(auditLogs).values({
    id: `aud-${crypto.randomUUID()}`,
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    module: params.module,
    entityType: params.entityType,
    entityId: params.entityId,
    action: params.action,
    oldValues: params.oldValues ? JSON.stringify(params.oldValues) : null,
    newValues: params.newValues ? JSON.stringify(params.newValues) : null,
    reason: params.reason || null,
    ipAddress: params.ipAddress || null,
  })
}
