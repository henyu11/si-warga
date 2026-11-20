import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionUser } from '@/server/services/auth.service'
import { getUserById, updateUser, deactivateUser } from '@/server/services/user.service'

const updateUserSchema = z.object({
  fullName: z.string().min(2).optional(),
  username: z.string().min(3).optional(),
  email: z.string().email().optional().nullable(),
  password: z.string().min(8).optional(),
  role: z.enum(['ADMIN', 'BENDAHARA', 'KETUA']).optional(),
  isActive: z.number().int().min(0).max(1).optional(),
})

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await getSessionUser()
  if (!actor) {
    return NextResponse.json({ success: false, message: 'Tidak terautentikasi' }, { status: 401 })
  }
  if (actor.role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'Akses ditolak.' }, { status: 403 })
  }

  const { id } = await params
  const user = await getUserById(id)
  if (!user) {
    return NextResponse.json({ success: false, message: 'Pengguna tidak ditemukan' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: user })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await getSessionUser()
  if (!actor) {
    return NextResponse.json({ success: false, message: 'Tidak terautentikasi' }, { status: 401 })
  }
  if (actor.role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'Akses ditolak.' }, { status: 403 })
  }

  const { id } = await params
  try {
    const body = await req.json()
    const parsed = updateUserSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Validasi gagal', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const updated = await updateUser(id, parsed.data, {
      id: actor.id,
      role: actor.role,
    })

    return NextResponse.json({
      success: true,
      message: 'Data pengguna berhasil diperbarui.',
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
    return NextResponse.json({ success: false, message: 'Akses ditolak.' }, { status: 403 })
  }

  const { id } = await params
  try {
    await deactivateUser(id, {
      id: actor.id,
      role: actor.role,
    })

    return NextResponse.json({
      success: true,
      message: 'Pengguna berhasil dinonaktifkan.',
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Gagal' }, { status: 500 })
  }
}
