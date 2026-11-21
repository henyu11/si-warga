export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionUser } from '@/server/services/auth.service'
import { addFineToBill } from '@/server/services/billing.service'

const addFineSchema = z.object({
  fine_date: z.string().min(1, 'Tanggal denda wajib diisi'),
  fine_note: z.string().min(3, 'Keterangan denda minimal 3 karakter'),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params
  try {
    const body = await req.json()
    const parsed = addFineSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Validasi gagal', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const fineItem = await addFineToBill({
      billId: id,
      fineDate: parsed.data.fine_date,
      fineNote: parsed.data.fine_note,
      actor: { id: actor.id, role: actor.role },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Denda ronda berhasil ditambahkan ke tagihan warga.',
        data: fineItem,
      },
      { status: 201 }
    )
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Gagal menambahkan denda' },
      { status: 500 }
    )
  }
}
