import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyJwt } from '@/lib/auth'

const PUBLIC_PATHS = [
  '/login',
  '/api/v1/auth/login',
  '/manifest.webmanifest',
  '/robots.txt',
  '/icon.png',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if public path or static asset
  if (
    PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith('/_next') || pathname.startsWith('/public'))
  ) {
    return NextResponse.next()
  }

  const token = request.cookies.get('rtrw_session')?.value

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Autentikasi diperlukan.',
        },
        { status: 401 }
      )
    }
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  const payload = await verifyJwt(token)
  if (!payload) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Sesi telah kedaluwarsa atau tidak valid.',
        },
        { status: 401 }
      )
    }
    const loginUrl = new URL('/login', request.url)
    const response = NextResponse.redirect(loginUrl)
    response.cookies.delete('rtrw_session')
    return response
  }

  // Attach user context headers for downstream use
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', payload.userId)
  requestHeaders.set('x-user-role', payload.role)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
