import { NextResponse } from 'next/server'
import { getSessionUser } from '@/server/services/auth.service'
import { getDashboardData } from '@/server/services/dashboard.service'

export async function GET(req: Request) {
  const actor = await getSessionUser()
  if (!actor) {
    return NextResponse.json({ success: false, message: 'Tidak terautentikasi' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const now = new Date()
  const month = searchParams.get('month') ? Number(searchParams.get('month')) : now.getMonth() + 1
  const year = searchParams.get('year') ? Number(searchParams.get('year')) : now.getFullYear()

  try {
    const data = await getDashboardData(month, year)
    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Gagal memuat data dashboard' },
      { status: 500 }
    )
  }
}
