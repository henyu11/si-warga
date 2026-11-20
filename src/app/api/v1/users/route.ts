import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionUser } from '@/server/services/auth.service'
import { listUsers, createUser } from '@/server/services/user.service'

const createUserSchema = z.object({
  fullName: z.string().min(2, 'Nama lengkap minimal 2 karakter'),
  username: z.string().min(3, 'Username minimal 3 karakter'),
  email: z.string().email('Format email tidak valid').optional().nullable(),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  role: z.enum(['ADMIN', 'BENDAHARA', 'KETUA']),
})

export async function GET() {
  const actor = await getSessionUser()
  if (!actor) {
    return NextResponse.json({ success: false, message: 'Tidak terautentikasi' }, { status: 401 })
  }
  if (actor.role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'Akses ditolak. Hanya Admin yang diizinkan.' }, { status: 403 })
  }

  const users = await listUsers()
  return NextResponse.json({
    success: true,
    data: users,
  })
}

export async function POST(req: Request) {
  const actor = await getSessionUser()
  if (!actor) {
    return NextResponse.json({ success: false, message: 'Tidak terautentikasi' }, { status: 401 })
  }
  if (actor.role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'Akses ditolak. Hanya Admin yang diizinkan.' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const parsed = createUserSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Validasi gagal', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const created = await createUser(parsed.data, {
      id: actor.id,
      role: actor.role,
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Pengguna baru berhasil ditambahkan.',
        data: created,
      },
      { status: 201 }
    )
  } catch (err: any) {
    if (err.message?.includes('UNIQUE')) {
      return NextResponse.json(
        { success: false, message: 'Username atau email sudah digunakan.' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { success: false, message: 'Gagal menambahkan pengguna.' },
      { status: 500 }
    )
  }
}
