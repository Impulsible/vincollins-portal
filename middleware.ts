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
  
  // Protected routes
  const protectedRoutes = ['/admin', '/student', '/staff']
  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  )
  
  // Auth routes (redirect to dashboard if already logged in)
  const authRoutes = ['/portal']
  const isAuthRoute = authRoutes.some(route => 
    req.nextUrl.pathname === route
  )
  
  // If user is logged in and tries to access login page, redirect to their dashboard
  if (session && isAuthRoute) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', session.user.id)
      .maybeSingle()
    
    if (userData?.role === 'admin') {
      return NextResponse.redirect(new URL('/admin', req.url))
    } else if (userData?.role === 'staff') {
      return NextResponse.redirect(new URL('/staff', req.url))
    } else if (userData?.role === 'student') {
      return NextResponse.redirect(new URL('/student', req.url))
    }
  }
  
  // If user is not logged in and tries to access protected route, redirect to login
  if (!session && isProtectedRoute) {
    const redirectUrl = new URL('/portal', req.url)
    return NextResponse.redirect(redirectUrl)
  }
  
  return response
}

export const config = {
  matcher: ['/admin/:path*', '/student/:path*', '/staff/:path*', '/portal']
}