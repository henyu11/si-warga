import React from 'react'
import { ArrearsListView } from '@/components/whatsapp/ArrearsListView'

export const metadata = {
  title: 'Penagihan WhatsApp | SiWarga RT 04',
  description: 'Daftar penagihan iuran RT via WhatsApp',
}

export default function PenagihanWaPage() {
  return (
    <div className="max-w-6xl mx-auto py-2">
      <ArrearsListView />
    </div>
  )
}
