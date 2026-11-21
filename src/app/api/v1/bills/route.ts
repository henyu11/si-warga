export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getSessionUser } from '@/server/services/auth.service'
import { listBills } from '@/server/services/billing.service'

export async function GET(req: Request) {
  const actor = await getSessionUser()
  if (!actor) {
    return NextResponse.json({ success: false, message: 'Tidak terautentikasi' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const year = searchParams.get('year') ? Number(searchParams.get('year')) : undefined
  const month = searchParams.get('month') ? Number(searchParams.get('month')) : undefined
  const status = (searchParams.get('status') as any) || undefined
  const search = searchParams.get('search') || undefined

  const bills = await listBills({
    year,
    month,
    status,
    search,
  })

  return NextResponse.json({
    success: true,
    data: bills,
  })
}
