import { NextResponse } from 'next/server'
import { z } from 'zod'
import { loginUser, SESSION_COOKIE_NAME } from '@/server/services/auth.service'

const loginSchema = z.object({
  identifier: z.string().min(1, 'Username atau email wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
})

// Simple in-memory rate limiting: 5 failed attempts per 15 minutes per identifier/IP
const failedAttempts = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const record = failedAttempts.get(key)
  if (!record) return true
  if (now > record.resetAt) {
    failedAttempts.delete(key)
    return true
  }
  return record.count < 5
}

function recordFailedAttempt(key: string) {
  const now = Date.now()
  const record = failedAttempts.get(key)
  if (!record || now > record.resetAt) {
    failedAttempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 })
  } else {
    record.count += 1
  }
}

function clearRateLimit(key: string) {
  failedAttempts.delete(key)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validasi gagal',
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { identifier, password } = parsed.data

    if (!checkRateLimit(identifier)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Terlalu banyak percobaan gagal. Silakan coba lagi setelah 15 menit.',
        },
        { status: 429 }
      )
    }

    const result = await loginUser(identifier, password)

    if ('error' in result) {
      recordFailedAttempt(identifier)
      return NextResponse.json(
        {
          success: false,
          message: result.error,
        },
        { status: 401 }
      )
    }

    clearRateLimit(identifier)

    const isHttps =
      req.headers.get('x-forwarded-proto') === 'https' ||
      req.url.startsWith('https://')
    const isSecure = process.env.NODE_ENV === 'production' && isHttps

    const response = NextResponse.json({
      success: true,
      message: 'Login berhasil.',
      data: {
        user: result.user,
      },
    })

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: result.token,
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 86400, // 24 hours
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan pada server.',
      },
      { status: 500 }
    )
  }
}
