import { NextResponse } from 'next/server'
import { getSessionUser } from '@/server/services/auth.service'
import { getImpactPreview } from '@/server/services/settings.service'

export async function GET(req: Request) {
  const actor = await getSessionUser()
  if (!actor) {
    return NextResponse.json({ success: false, message: 'Tidak terautentikasi' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const feeType = searchParams.get('fee_type') as any
  const year = Number(searchParams.get('year') || new Date().getFullYear())
  const month = Number(searchParams.get('month') || new Date().getMonth() + 1)

  if (!feeType || !['IURAN_WAJIB', 'IURAN_KEAMANAN', 'DENDA_RONDA'].includes(feeType)) {
    return NextResponse.json({ success: false, message: 'Jenis tarif tidak valid' }, { status: 400 })
  }

  const preview = await getImpactPreview(feeType, year, month)

  return NextResponse.json({
    success: true,
    data: preview,
  })
}
