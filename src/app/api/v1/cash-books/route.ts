export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getSessionUser } from '@/server/services/auth.service'
import { getCashBooksSummary } from '@/server/services/cash.service'

export async function GET() {
  const actor = await getSessionUser()
  if (!actor) {
    return NextResponse.json({ success: false, message: 'Tidak terautentikasi' }, { status: 401 })
  }

  const summary = await getCashBooksSummary()
  return NextResponse.json({ success: true, data: summary })
}
