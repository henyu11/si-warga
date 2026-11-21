export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionUser } from '@/server/services/auth.service'
import { listHouseholds, createHousehold } from '@/server/services/household.service'

const createHouseholdSchema = z.object({
  blockNumber: z.string().min(1, 'Blok / Nomor rumah wajib diisi'),
  headName: z.string().min(2, 'Nama kepala keluarga wajib diisi'),
  phoneWa: z.string().min(8, 'Nomor WhatsApp minimal 8 digit'),
  occupancyStatus: z.enum(['TETAP', 'KONTRAK', 'KOSONG']).default('TETAP'),
  isBillingActive: z.number().int().min(0).max(1).default(1),
  notes: z.string().optional().nullable(),
})

export async function GET(req: Request) {
  const actor = await getSessionUser()
  if (!actor) {
    return NextResponse.json({ success: false, message: 'Tidak terautentikasi' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || undefined
  const occupancyStatus = searchParams.get('status') || undefined
  const isBillingActiveStr = searchParams.get('is_active')
  const isBillingActive = isBillingActiveStr !== null ? Number(isBillingActiveStr) : undefined

  const households = await listHouseholds({
    search,
    occupancyStatus,
    isBillingActive,
  })

  return NextResponse.json({
    success: true,
    data: households,
  })
}

export async function POST(req: Request) {
  const actor = await getSessionUser()
  if (!actor) {
    return NextResponse.json({ success: false, message: 'Tidak terautentikasi' }, { status: 401 })
  }
  if (actor.role === 'KETUA') {
    return NextResponse.json(
      { success: false, message: 'Ketua RT memiliki akses baca saja untuk data warga.' },
      { status: 403 }
    )
  }

  try {
    const body = await req.json()
    const parsed = createHouseholdSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Validasi gagal', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const created = await createHousehold(parsed.data, {
      id: actor.id,
      role: actor.role,
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Data warga berhasil ditambahkan.',
        data: created,
      },
      { status: 201 }
    )
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Gagal menambahkan data warga' },
      { status: 500 }
    )
  }
}
