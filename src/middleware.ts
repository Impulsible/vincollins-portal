import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const pathname = request.nextUrl.pathname

  // Public routes - allow access
  const publicRoutes = ['/', '/portal', '/login', '/auth', '/admission', '/schools', '/contact']
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return response
  }

  // If not logged in, redirect to portal
  if (!session) {
    return NextResponse.redirect(new URL('/portal', request.url))
  }

  // Get user role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  const role = profile?.role || 'student'

  // Role-based route protection
  if (pathname.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL(`/${role === 'teacher' ? 'staff' : 'student'}`, request.url))
  }

  if (pathname.startsWith('/staff') && role !== 'teacher' && role !== 'admin') {
    return NextResponse.redirect(new URL('/student', request.url))
  }

  if (pathname.startsWith('/student') && role !== 'student' && role !== 'teacher' && role !== 'admin') {
    return NextResponse.redirect(new URL('/portal', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|api).*)',
  ]
}