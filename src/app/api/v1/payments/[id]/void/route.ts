import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionUser } from '@/server/services/auth.service'
import { voidPayment } from '@/server/services/payment.service'

const voidPaymentSchema = z.object({
  reason: z.string().min(5, 'Alasan pembatalan wajib diisi (minimal 5 karakter)'),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await getSessionUser()
  if (!actor) {
    return NextResponse.json({ success: false, message: 'Tidak terautentikasi' }, { status: 401 })
  }
  if (actor.role !== 'ADMIN' && actor.role !== 'BENDAHARA') {
    return NextResponse.json(
      { success: false, message: 'Hanya Admin atau Bendahara yang dapat membatalkan pembayaran.' },
      { status: 403 }
    )
  }

  const { id } = await params
  try {
    const body = await req.json()
    const parsed = voidPaymentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Validasi gagal', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    await voidPayment(
      id,
      { reason: parsed.data.reason },
      { id: actor.id, role: actor.role }
    )

    return NextResponse.json({
      success: true,
      message: 'Pembayaran berhasil dibatalkan dan saldo Buku Kas otomatis dibalikkan.',
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Gagal membatalkan pembayaran' },
      { status: 500 }
    )
  }
}
