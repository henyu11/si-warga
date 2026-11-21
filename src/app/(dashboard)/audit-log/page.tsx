import React from 'react'
import { AuditLogTable } from '@/components/audit/AuditLogTable'

export const metadata = {
  title: 'Audit Trail | SiWarga RT 04',
  description: 'Log audit permanen dan rekam jejak keuangan RT 04',
}

export default function AuditLogPage() {
  return (
    <div className="max-w-7xl mx-auto py-2">
      <AuditLogTable />
    </div>
  )
}
