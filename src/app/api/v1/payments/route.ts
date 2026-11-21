import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionUser } from '@/server/services/auth.service'
import { recordPayment } from '@/server/services/payment.service'

const allocationSchema = z.object({
  billItemId: z.string().min(1),
  amount: z.number().int().positive('Nominal alokasi harus lebih dari 0'),
})

const recordPaymentSchema = z.object({
  billId: z.string().min(1, 'ID tagihan wajib diisi'),
  paymentMethod: z.enum(['TUNAI', 'TRANSFER']),
  allocations: z.array(allocationSchema).min(1, 'Pilih minimal 1 komponen yang dibayar'),
  receiptFileKey: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function POST(req: Request) {
  const actor = await getSessionUser()
  if (!actor) {
    return NextResponse.json({ success: false, message: 'Tidak terautentikasi' }, { status: 401 })
  }
  if (actor.role === 'KETUA') {
    return NextResponse.json(
      { success: false, message: 'Ketua RT memiliki hak akses baca saja.' },
      { status: 403 }
    )
  }

  try {
    const body = await req.json()
    const parsed = recordPaymentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Validasi gagal', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const payment = await recordPayment(parsed.data, {
      id: actor.id,
      role: actor.role,
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Pembayaran berhasil dicatat & dialokasikan ke Buku Kas terkait.',
        data: payment,
      },
      { status: 201 }
    )
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Gagal mencatat pembayaran' },
      { status: 500 }
    )
  }
}
