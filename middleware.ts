// middleware.ts - FIXED VERSION

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ── Route config ──────────────────────────────────────────────────────────────
const PROTECTED_ROUTES = {
  '/admin': ['admin'],
  '/staff': ['staff', 'admin'],
  '/student': ['student'],
} as const

const AUTH_ROUTES = ['/portal', '/admin/portal']

// ── Helpers ───────────────────────────────────────────────────────────────────
function getRedirectForRole(role: string, baseUrl: string): string {
  const map: Record<string, string> = {
    admin: '/admin',
    staff: '/staff',
    student: '/student',
  }
  return map[role.toLowerCase()] || '/portal'
}

function getRequiredRoles(pathname: string): string[] | null {
  for (const [route, roles] of Object.entries(PROTECTED_ROUTES)) {
    if (pathname.startsWith(route)) return [...roles]
  }
  return null
}

// ── Middleware ────────────────────────────────────────────────────────────────
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ✅ CRITICAL FIX: Skip ALL Next.js internals and static assets immediately.
  // This must be the FIRST thing in middleware so image optimizer requests
  // never reach Supabase auth logic.
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/images/') ||
    pathname === '/favicon.ico' ||
    pathname === '/sw.js' ||
    pathname === '/manifest.json' ||
    pathname === '/offline.html' ||
    /\.[^/]+$/.test(pathname) // any file with an extension
  ) {
    return NextResponse.next()
  }

  const res = NextResponse.next({ request: { headers: req.headers } })

  // ✅ Skip middleware for staff exam sub-routes
  if (pathname.startsWith('/staff/exams/')) {
    return res
  }

  // Validate env
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    console.error('[Middleware] Missing Supabase environment variables')
    if (process.env.NODE_ENV === 'development') {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
    }
    return res
  }

  // Build supabase client with cookie forwarding
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError) {
    console.warn('[Middleware] Auth error:', userError.message)
  }

  const isLoggedIn = !!user
  const isAuthPage = AUTH_ROUTES.some((r) => pathname.startsWith(r))

  if (isAuthPage && isLoggedIn) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role) {
        const destination = getRedirectForRole(profile.role, req.url)
        return NextResponse.redirect(new URL(destination, req.url))
      }
    } catch (err) {
      console.warn('[Middleware] Profile fetch error:', err)
    }
    return res
  }

  const requiredRoles = getRequiredRoles(pathname)

  if (requiredRoles) {
    if (!isLoggedIn) {
      const url = new URL('/portal', req.url)
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const userRole = profile?.role?.toLowerCase()

      if (!userRole || !requiredRoles.includes(userRole)) {
        const destination = userRole
          ? getRedirectForRole(userRole, req.url)
          : '/portal'
        return NextResponse.redirect(new URL(destination, req.url))
      }
    } catch (err) {
      console.error('[Middleware] Role check failed:', err)
      return NextResponse.redirect(new URL('/portal', req.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match everything EXCEPT:
     * - _next/static (static build files)
     * - _next/image (image optimization)
     * - images (your public image folder)
     * - favicon, sw.js, manifest.json, offline.html
     * - api routes
     * - any path ending in a file extension (catch-all for assets)
     */
    '/((?!_next/static|_next/image|images|favicon|sw\\.js|manifest\\.json|offline\\.html|api|.*\\.[^/]+$).*)',
  ],
}