import React from 'react'
import { ArrearsListView } from '@/components/whatsapp/ArrearsListView'

export const metadata = {
  title: 'Penagihan WhatsApp | SiWarga RT 04',
  description: 'Daftar penagihan iuran RT via WhatsApp',
}

export default function PenagihanWaPage() {
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto w-full">
      <ArrearsListView />
    </div>
  )
}
