// middleware.ts - ZERO-LOG, ZERO-EGRESS CACHED VERSION (FULLY TYPE-SAFE)

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ── Protected Route Configuration ─────────────────────────────────────────────
const PROTECTED_ROUTES: Record<string, string[]> = {
  '/admin': ['admin'],
  '/staff': ['staff', 'admin'],
  '/student': ['student'],
}

const AUTH_ROUTES = ['/portal', '/admin/portal']

function getRedirectForRole(role: string): string {
  const map: Record<string, string> = {
    admin: '/admin',
    staff: '/staff',
    student: '/student',
  }
  return map[role.toLowerCase()] || '/portal'
}

function getRequiredRoles(pathname: string): string[] | null {
  for (const [route, roles] of Object.entries(PROTECTED_ROUTES)) {
    if (pathname.startsWith(route)) return roles
  }
  return null
}

// ── Middleware Handler ────────────────────────────────────────────────────────
export async function middleware(req: NextRequest) {
  const res = NextResponse.next({ request: { headers: req.headers } })
  const pathname = req.nextUrl.pathname

  // Skip subroutes like staff exam reviews
  if (pathname.startsWith('/staff/exams/')) {
    return res
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return res
  }

  // Supabase client with cookie persistence
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value)
            res.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // 1. Get authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = Boolean(user)

  const isAuthPage = AUTH_ROUTES.some((r) => pathname.startsWith(r))
  const requiredRoles = getRequiredRoles(pathname)

  // 2. Handle protected or auth routes
  if (isLoggedIn && (isAuthPage || requiredRoles)) {
    // Read cached role from cookie to prevent repeated DB queries
    let userRole = req.cookies.get('app_user_role')?.value

    if (!userRole && user) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()

        if (profile?.role) {
          // Strictly enforce string type for TypeScript
          const resolvedRole: string = String(profile.role).toLowerCase()
          userRole = resolvedRole

          // Store role in cookie for 1 hour (fixes TS Error 2345)
          res.cookies.set('app_user_role', resolvedRole, {
            path: '/',
            maxAge: 3600,
            sameSite: 'lax',
            httpOnly: false,
          })
        }
      } catch {
        // Fallback gracefully without crash
      }
    }

    // A. Logged in user visiting login page -> route to dashboard
    if (isAuthPage && userRole) {
      const destination = getRedirectForRole(userRole)
      return NextResponse.redirect(new URL(destination, req.url))
    }

    // B. Role-based route guard
    if (requiredRoles && userRole) {
      if (!requiredRoles.includes(userRole)) {
        const destination = getRedirectForRole(userRole)
        return NextResponse.redirect(new URL(destination, req.url))
      }
    }
  }

  // 3. Unauthenticated user accessing protected route -> redirect to portal
  if (!isLoggedIn && requiredRoles) {
    const url = new URL('/portal', req.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  return res
}

// ── Matcher ───────────────────────────────────────────────────────────────────
export const config = {
  matcher: [
    '/admin/:path*',
    '/staff/:path*',
    '/student/:path*',
    '/portal',
    '/admin/portal',
  ],
}