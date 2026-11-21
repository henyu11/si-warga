import { NextResponse } from 'next/server'
import { getSessionUser } from '@/server/services/auth.service'
import { updateManualTransaction } from '@/server/services/cash.service'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await getSessionUser()
  if (!actor) {
    return NextResponse.json({ success: false, message: 'Tidak terautentikasi' }, { status: 401 })
  }

  if (actor.role !== 'BENDAHARA' && actor.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, message: 'Hanya Bendahara atau Admin yang dapat mengubah transaksi kas' },
      { status: 403 }
    )
  }

  try {
    const { id } = await params
    const body = await req.json()
    const updated = await updateManualTransaction(id, body, actor)
    return NextResponse.json({ success: true, data: updated })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Gagal mengubah transaksi kas' },
      { status: 400 }
    )
  }
}
