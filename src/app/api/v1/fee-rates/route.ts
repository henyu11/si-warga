export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionUser } from '@/server/services/auth.service'
import { getActiveFeeRates, createFeeRate } from '@/server/services/settings.service'

const createFeeRateSchema = z.object({
  feeType: z.enum(['IURAN_WAJIB', 'IURAN_KEAMANAN', 'DENDA_RONDA']),
  amount: z.number().int().positive('Nominal harus bilangan positif'),
  effectiveFrom: z.string().min(1, 'Tanggal berlaku wajib diisi'),
  changeReason: z.string().min(5, 'Alasan perubahan minimal 5 karakter'),
  applyToUnpaidCurrentMonth: z.boolean().default(false),
})

export async function GET() {
  const actor = await getSessionUser()
  if (!actor) {
    return NextResponse.json({ success: false, message: 'Tidak terautentikasi' }, { status: 401 })
  }

  const rates = await getActiveFeeRates()
  return NextResponse.json({
    success: true,
    data: rates,
  })
}

export async function POST(req: Request) {
  const actor = await getSessionUser()
  if (!actor) {
    return NextResponse.json({ success: false, message: 'Tidak terautentikasi' }, { status: 401 })
  }
  if (actor.role === 'KETUA') {
    return NextResponse.json(
      { success: false, message: 'Ketua RT memiliki hak akses baca saja untuk pengaturan tarif.' },
      { status: 403 }
    )
  }

  try {
    const body = await req.json()
    const parsed = createFeeRateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Validasi gagal', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const result = await createFeeRate(parsed.data, {
      id: actor.id,
      role: actor.role,
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Tarif berhasil diperbarui dan dicatat di Audit Trail.',
        data: result,
      },
      { status: 201 }
    )
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Gagal mengubah tarif' },
      { status: 500 }
    )
  }
}
