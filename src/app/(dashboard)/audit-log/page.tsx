import React from 'react'
import { AuditLogTable } from '@/components/audit/AuditLogTable'

export const metadata = {
  title: 'Audit Trail | SiWarga RT 04',
  description: 'Log audit permanen dan rekam jejak keuangan RT 04',
}

export default function AuditLogPage() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
      <AuditLogTable />
    </div>
  )
}
