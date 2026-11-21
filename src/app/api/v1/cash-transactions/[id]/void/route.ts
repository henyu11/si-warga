import { NextResponse } from 'next/server'
import { getSessionUser } from '@/server/services/auth.service'
import { voidManualTransaction } from '@/server/services/cash.service'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await getSessionUser()
  if (!actor) {
    return NextResponse.json({ success: false, message: 'Tidak terautentikasi' }, { status: 401 })
  }

  if (actor.role !== 'BENDAHARA' && actor.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, message: 'Hanya Bendahara atau Admin yang dapat membatalkan transaksi kas' },
      { status: 403 }
    )
  }

  try {
    const { id } = await params
    const body = await req.json()
    await voidManualTransaction(id, { reason: body.reason }, actor)
    return NextResponse.json({ success: true, message: 'Transaksi kas berhasil dibatalkan' })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Gagal membatalkan transaksi kas' },
      { status: 400 }
    )
  }
}
