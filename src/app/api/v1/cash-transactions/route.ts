export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getSessionUser } from '@/server/services/auth.service'
import {
  listTransactions,
  createManualTransaction,
} from '@/server/services/cash.service'

export async function GET(req: Request) {
  const actor = await getSessionUser()
  if (!actor) {
    return NextResponse.json({ success: false, message: 'Tidak terautentikasi' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const bookType = searchParams.get('book_type') as any
  const cashBookId = searchParams.get('cash_book_id') || undefined
  const year = searchParams.get('year') ? Number(searchParams.get('year')) : undefined
  const month = searchParams.get('month') ? Number(searchParams.get('month')) : undefined
  const categoryId = searchParams.get('category_id') || undefined
  const transactionType = searchParams.get('transaction_type') as any

  const result = await listTransactions({
    bookType,
    cashBookId,
    year,
    month,
    categoryId,
    transactionType,
  })

  return NextResponse.json({ success: true, data: result })
}

export async function POST(req: Request) {
  const actor = await getSessionUser()
  if (!actor) {
    return NextResponse.json({ success: false, message: 'Tidak terautentikasi' }, { status: 401 })
  }

  if (actor.role !== 'BENDAHARA' && actor.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, message: 'Hanya Bendahara atau Admin yang dapat mencatat transaksi kas' },
      { status: 403 }
    )
  }

  try {
    const body = await req.json()
    const tx = await createManualTransaction(body, actor)
    return NextResponse.json({ success: true, data: tx }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Gagal membuat transaksi kas' },
      { status: 400 }
    )
  }
}
