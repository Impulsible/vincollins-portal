// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ── Route config ──────────────────────────────────────────────────────────────
const PROTECTED_ROUTES = {
  '/admin': ['admin'],
  '/staff': ['staff', 'admin'],   // admin can also view staff
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
  const res = NextResponse.next({ request: { headers: req.headers } })
  const pathname = req.nextUrl.pathname

  // Validate env — fail fast in dev, log in prod
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

  // Build supabase client with cookie forwarding - FIXED cookies structure
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

  // Get session — use getUser() not getSession() for server-side (more secure)
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError) {
    console.warn('[Middleware] Auth error:', userError.message)
  }

  const isLoggedIn = !!user

  // ── Auth pages (portal/login) ─────────────────────────────────────────────
  const isAuthPage = AUTH_ROUTES.some((r) => pathname.startsWith(r))

  if (isAuthPage && isLoggedIn) {
    // User is logged in but on login page — redirect to their dashboard
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
    // If profile fetch fails, let them stay on portal
    return res
  }

  // ── Protected routes ──────────────────────────────────────────────────────
  const requiredRoles = getRequiredRoles(pathname)

  if (requiredRoles) {
    // Not logged in — send to portal
    if (!isLoggedIn) {
      const url = new URL('/portal', req.url)
      url.searchParams.set('redirect', pathname) // remember where they were going
      return NextResponse.redirect(url)
    }

    // Logged in — check role
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const userRole = profile?.role?.toLowerCase()

      if (!userRole || !requiredRoles.includes(userRole)) {
        // Wrong role — redirect to their correct dashboard
        const destination = userRole
          ? getRedirectForRole(userRole, req.url)
          : '/portal'

        console.warn(
          `[Middleware] Role mismatch: user has "${userRole}", route requires "${requiredRoles.join('|')}"`
        )

        return NextResponse.redirect(new URL(destination, req.url))
      }
    } catch (err) {
      console.error('[Middleware] Role check failed:', err)
      // On error — safer to send to portal than allow access
      return NextResponse.redirect(new URL('/portal', req.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/student/:path*',
    '/staff/:path*',
    '/portal',
    '/',
    /*
     * Skip:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.png
     * - public assets
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon|images|sw\\.js|manifest\\.json|offline\\.html|api).*)',
  ],
}