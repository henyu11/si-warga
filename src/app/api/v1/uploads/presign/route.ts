import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionUser } from '@/server/services/auth.service'
import { generatePresignedPut } from '@/lib/r2'

const presignSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().regex(/^image\/(jpeg|png|webp|jpg)$/, 'Hanya foto JPG, PNG, atau WebP yang diperbolehkan'),
  size: z.number().max(2 * 1024 * 1024, 'Ukuran foto maksimal 2 MB'),
})

export async function POST(req: Request) {
  const actor = await getSessionUser()
  if (!actor) {
    return NextResponse.json({ success: false, message: 'Tidak terautentikasi' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = presignSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Validasi file gagal', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { uploadUrl, fileKey } = await generatePresignedPut(
      parsed.data.filename,
      parsed.data.contentType
    )

    return NextResponse.json({
      success: true,
      data: {
        uploadUrl,
        fileKey,
      },
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Gagal generate upload URL' },
      { status: 500 }
    )
  }
}
