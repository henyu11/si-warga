import React from 'react'
import { DualCashSwitcher } from '@/components/cash/DualCashSwitcher'

export const metadata = {
  title: 'Buku Kas | siWarga Palmut',
  description: 'Pencatatan dual-ledger terpisah antara Kas Umum & Kas Keamanan',
}

export default function KasPage() {
  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4">
      <DualCashSwitcher />
    </div>
  )
}
