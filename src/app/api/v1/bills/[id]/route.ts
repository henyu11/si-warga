export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getSessionUser } from '@/server/services/auth.service'
import { getBillDetail } from '@/server/services/billing.service'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await getSessionUser()
  if (!actor) {
    return NextResponse.json({ success: false, message: 'Tidak terautentikasi' }, { status: 401 })
  }

  const { id } = await params
  const bill = await getBillDetail(id)
  if (!bill) {
    return NextResponse.json({ success: false, message: 'Tagihan tidak ditemukan' }, { status: 404 })
  }

  return NextResponse.json({
    success: true,
    data: bill,
  })
}
