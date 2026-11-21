export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getSessionUser } from '@/server/services/auth.service'
import { generatePresignedGet } from '@/lib/r2'

export async function GET(req: Request) {
  const actor = await getSessionUser()
  if (!actor) {
    return NextResponse.json({ success: false, message: 'Tidak terautentikasi' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const key = searchParams.get('key')
  if (!key) {
    return NextResponse.json({ success: false, message: 'Key file wajib disertakan' }, { status: 400 })
  }

  try {
    const viewUrl = await generatePresignedGet(key, 300)
    return NextResponse.json({
      success: true,
      data: { viewUrl },
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Gagal memuat URL file' },
      { status: 500 }
    )
  }
}
