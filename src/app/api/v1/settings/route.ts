import { NextResponse } from 'next/server'
import { getSessionUser } from '@/server/services/auth.service'
import { getAppSettings, updateAppSettings } from '@/server/services/settings.service'

export async function GET() {
  const actor = await getSessionUser()
  if (!actor) {
    return NextResponse.json({ success: false, message: 'Tidak terautentikasi' }, { status: 401 })
  }

  const settings = await getAppSettings()
  return NextResponse.json({
    success: true,
    data: settings,
  })
}

export async function PATCH(req: Request) {
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
    if (typeof body !== 'object' || body === null) {
      return NextResponse.json({ success: false, message: 'Format body tidak valid' }, { status: 400 })
    }

    await updateAppSettings(body, {
      id: actor.id,
      role: actor.role,
    })

    return NextResponse.json({
      success: true,
      message: 'Pengaturan berhasil diperbarui.',
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Gagal update pengaturan' },
      { status: 500 }
    )
  }
}
