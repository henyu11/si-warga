export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionUser } from '@/server/services/auth.service'
import { overrideBillItem } from '@/server/services/billing.service'

const overrideSchema = z.object({
  amount_due: z.number().int().min(0, 'Nominal tidak boleh negatif'),
  override_reason: z.string().min(5, 'Alasan penyesuaian minimal 5 karakter'),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ itemId: string }> }
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

  const { itemId } = await params
  try {
    const body = await req.json()
    const parsed = overrideSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Validasi gagal', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const updated = await overrideBillItem({
      itemId,
      amountDue: parsed.data.amount_due,
      reason: parsed.data.override_reason,
      actor: { id: actor.id, role: actor.role },
    })

    return NextResponse.json({
      success: true,
      message: 'Nominal komponen tagihan berhasil disesuaikan.',
      data: updated,
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Gagal override komponen' },
      { status: 500 }
    )
  }
}
