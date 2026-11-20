import { NextResponse } from 'next/server'
import { getSessionUser } from '@/server/services/auth.service'

export async function GET() {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json(
      {
        success: false,
        message: 'Tidak terautentikasi.',
      },
      { status: 401 }
    )
  }

  return NextResponse.json({
    success: true,
    data: { user },
  })
}
