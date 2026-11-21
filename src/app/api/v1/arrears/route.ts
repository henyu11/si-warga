import { NextResponse } from 'next/server'
import { getSessionUser } from '@/server/services/auth.service'
import { listArrears, buildRekapTunggakanText } from '@/server/services/arrears.service'

export async function GET(req: Request) {
  const actor = await getSessionUser()
  if (!actor) {
    return NextResponse.json({ success: false, message: 'Tidak terautentikasi' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const mode = (searchParams.get('mode') as any) || 'period'
  const year = searchParams.get('year') ? Number(searchParams.get('year')) : new Date().getFullYear()
  const month = searchParams.get('month') ? Number(searchParams.get('month')) : new Date().getMonth() + 1
  const search = searchParams.get('search') || undefined

  const arrears = await listArrears({
    year,
    month,
    mode,
    search,
  })

  const periodLabel = mode === 'accumulated' ? 'Semua Akumulasi Tunggakan' : `Periode ${month}/${year}`
  const rekapText = buildRekapTunggakanText(arrears, periodLabel)

  return NextResponse.json({
    success: true,
    data: {
      arrears,
      totalCount: arrears.length,
      totalAmount: arrears.reduce((sum, a) => sum + a.totalRemaining, 0),
      rekapText,
    },
  })
}
