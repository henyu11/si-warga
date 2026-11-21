import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionUser } from '@/server/services/auth.service'
import { generateMonthlyBills } from '@/server/services/billing.service'

const generateSchema = z.object({
  period_year: z.number().int().min(2020).max(2050),
  period_month: z.number().int().min(1).max(12),
  due_date: z.string().min(1),
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
    const parsed = generateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Validasi gagal', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const result = await generateMonthlyBills({
      year: parsed.data.period_year,
      month: parsed.data.period_month,
      dueDate: parsed.data.due_date,
      actor: { id: actor.id, role: actor.role },
    })

    return NextResponse.json(
      {
        success: true,
        message: `Generate tagihan periode ${parsed.data.period_month}/${parsed.data.period_year} selesai.`,
        data: result,
      },
      { status: 201 }
    )
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Gagal generate tagihan' },
      { status: 500 }
    )
  }
}
