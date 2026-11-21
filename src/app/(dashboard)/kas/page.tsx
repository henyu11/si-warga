import React from 'react'
import { DualCashSwitcher } from '@/components/cash/DualCashSwitcher'

export const metadata = {
  title: 'Buku Kas RT/RW | SiWarga RT 04',
  description: 'Pencatatan dual-ledger terpisah antara Kas Umum & Kas Keamanan',
}

export default function KasPage() {
  return (
    <div className="max-w-7xl mx-auto py-2">
      <DualCashSwitcher />
    </div>
  )
}
