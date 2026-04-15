/* eslint-disable @typescript-eslint/no-explicit-any */
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const path = req.nextUrl.pathname
  
  // Protected routes
  const protectedRoutes = ['/admin', '/student', '/staff']
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route))
  
  // Portal route
  const isPortalRoute = path === '/portal' || path === '/'
  
  // If user has session and tries to access portal, redirect to dashboard
  if (session && isPortalRoute) {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .or(`auth_id.eq.${session.user.id},id.eq.${session.user.id}`)
        .maybeSingle()
      
      if (userData?.role === 'admin') {
        return NextResponse.redirect(new URL('/admin', req.url))
      } else if (userData?.role === 'staff') {
        return NextResponse.redirect(new URL('/staff', req.url))
      } else if (userData?.role === 'student') {
        return NextResponse.redirect(new URL('/student', req.url))
      }
    } catch (err) {
      console.error('Middleware user check error:', err)
    }
  }
  
  // If no session and trying to access protected route, redirect to portal
  if (!session && isProtectedRoute) {
    return NextResponse.redirect(new URL('/portal', req.url))
  }
  
  return response
}

export const config = {
  matcher: ['/admin/:path*', '/student/:path*', '/staff/:path*', '/portal', '/']
}