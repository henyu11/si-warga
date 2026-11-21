import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionUser } from '@/server/services/auth.service'
import {
  getHouseholdById,
  updateHousehold,
  softDeleteHousehold,
} from '@/server/services/household.service'

const updateHouseholdSchema = z.object({
  blockNumber: z.string().min(1).optional(),
  headName: z.string().min(2).optional(),
  phoneWa: z.string().min(8).optional(),
  occupancyStatus: z.enum(['TETAP', 'KONTRAK', 'KOSONG']).optional(),
  isBillingActive: z.number().int().min(0).max(1).optional(),
  notes: z.string().optional().nullable(),
})

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await getSessionUser()
  if (!actor) {
    return NextResponse.json({ success: false, message: 'Tidak terautentikasi' }, { status: 401 })
  }

  const { id } = await params
  const household = await getHouseholdById(id)
  if (!household) {
    return NextResponse.json({ success: false, message: 'Data warga tidak ditemukan' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: household })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await getSessionUser()
  if (!actor) {
    return NextResponse.json({ success: false, message: 'Tidak terautentikasi' }, { status: 401 })
  }
  if (actor.role === 'KETUA') {
    return NextResponse.json(
      { success: false, message: 'Ketua RT memiliki akses baca saja.' },
      { status: 403 }
    )
  }

  const { id } = await params
  try {
    const body = await req.json()
    const parsed = updateHouseholdSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Validasi gagal', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const updated = await updateHousehold(id, parsed.data, {
      id: actor.id,
      role: actor.role,
    })

    return NextResponse.json({
      success: true,
      message: 'Data warga berhasil diperbarui.',
      data: updated,
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Gagal update' }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await getSessionUser()
  if (!actor) {
    return NextResponse.json({ success: false, message: 'Tidak terautentikasi' }, { status: 401 })
  }
  if (actor.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, message: 'Hanya Admin yang dapat menonaktifkan warga.' },
      { status: 403 }
    )
  }

  const { id } = await params
  try {
    await softDeleteHousehold(id, {
      id: actor.id,
      role: actor.role,
    })

    return NextResponse.json({
      success: true,
      message: 'Data warga berhasil dinonaktifkan (soft delete). Histori bayar tetap tersimpan.',
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Gagal' }, { status: 500 })
  }
}
