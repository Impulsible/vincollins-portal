/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
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
  const path = request.nextUrl.pathname

  // Public paths that don't require authentication
  const publicPaths = ['/portal', '/', '/api', '/_next', '/favicon.ico', '/manifest.json']
  const isPublicPath = publicPaths.some(p => path.startsWith(p))

  console.log('🔒 Middleware - Path:', path, 'Session:', !!session)

  // If no session and trying to access protected route
  if (!session && !isPublicPath) {
    console.log('❌ No session, redirecting to portal')
    return NextResponse.redirect(new URL('/portal', request.url))
  }

  // If has session and on portal page, redirect to appropriate dashboard
  if (session && path === '/portal') {
    console.log('✅ Has session on portal, checking role...')
    
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      const role = profile?.role?.toLowerCase()
      console.log('👤 User role:', role)

      if (role === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url))
      } else if (role === 'staff' || role === 'teacher') {
        return NextResponse.redirect(new URL('/staff', request.url))
      } else if (role === 'student') {
        return NextResponse.redirect(new URL('/student', request.url))
      }
    } catch (err) {
      console.error('Error fetching role:', err)
    }
  }

  // Role-based route protection
  if (session) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      const role = profile?.role?.toLowerCase()

      // Admin routes - only admin can access
      if (path.startsWith('/admin') && role !== 'admin') {
        console.log('❌ Non-admin trying to access /admin')
        return NextResponse.redirect(new URL(`/${role || 'portal'}`, request.url))
      }

      // Staff routes - staff, teacher, and admin can access
      if (path.startsWith('/staff') && role !== 'staff' && role !== 'teacher' && role !== 'admin') {
        console.log('❌ Non-staff trying to access /staff')
        return NextResponse.redirect(new URL('/student', request.url))
      }

      // Student routes - only student can access
      if (path.startsWith('/student') && role !== 'student') {
        console.log('❌ Non-student trying to access /student')
        return NextResponse.redirect(new URL(`/${role}`, request.url))
      }
    } catch (err) {
      console.error('Error in role protection:', err)
    }
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/staff/:path*', '/student/:path*', '/portal']
}