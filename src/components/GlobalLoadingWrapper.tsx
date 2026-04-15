/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

// Comprehensive list of all routes in your app
const ALL_ROUTES = [
  // Public routes
  '/',
  '/portal',
  '/admission',
  '/schools',
  '/cbt',
  '/contact',
  
  // Student routes
  '/student',
  '/student/exams',
  '/student/results',
  '/student/profile',
  '/student/attendance',
  '/student/exam',
  
  // Staff routes
  '/staff',
  '/staff/exams',
  '/staff/exams/create',
  '/staff/grading',
  '/staff/monitor',
  '/staff/analytics',
  '/staff/profile',
  
  // Admin routes
  '/admin',
  '/admin/cbt',
  '/admin/exams',
  '/admin/users',
  '/admin/settings',
  '/admin/reports',
  '/admin/profile',
  
  // Results and Exams
  '/results',
  '/exams',
  '/attendance',
]

export function GlobalLoadingWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [prevPathname, setPrevPathname] = useState(pathname)

  // Prefetch ALL routes automatically on mount
  useEffect(() => {
    // Prefetch all common routes
    ALL_ROUTES.forEach(route => {
      try {
        router.prefetch(route)
      } catch (e) {
        // Silently fail if route doesn't exist
      }
    })
  }, [router])

  // Handle page transitions
  useEffect(() => {
    if (pathname !== prevPathname) {
      setIsLoading(true)
      const timer = setTimeout(() => {
        setIsLoading(false)
        setPrevPathname(pathname)
      }, 200) // Faster transition (200ms)
      return () => clearTimeout(timer)
    }
  }, [pathname, prevPathname])

  // Intelligent skeleton that adapts to the current route
  const getSkeletonForRoute = () => {
    const route = pathname || ''
    
    // Admin Dashboard Skeleton
    if (route.startsWith('/admin')) {
      return <AdminDashboardSkeleton />
    }
    
    // Staff Dashboard Skeleton
    if (route.startsWith('/staff')) {
      return <StaffDashboardSkeleton />
    }
    
    // Student Dashboard Skeleton
    if (route.startsWith('/student')) {
      return <StudentDashboardSkeleton />
    }
    
    // Exams Page Skeleton
    if (route.includes('/exams')) {
      return <ExamsPageSkeleton />
    }
    
    // Results Page Skeleton
    if (route.includes('/results')) {
      return <ResultsPageSkeleton />
    }
    
    // Profile Page Skeleton
    if (route.includes('/profile')) {
      return <ProfilePageSkeleton />
    }
    
    // Home Page Skeleton
    if (route === '/') {
      return <HomePageSkeleton />
    }
    
    // Portal/Login Page Skeleton
    if (route === '/portal') {
      return <PortalPageSkeleton />
    }
    
    // Default skeleton for any other page
    return <DefaultPageSkeleton />
  }

  // Admin Dashboard Skeleton
  const AdminDashboardSkeleton = () => (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="h-40 w-full rounded-2xl bg-gradient-to-r from-gray-200 to-gray-100 animate-pulse" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 rounded-xl bg-gray-200 animate-pulse" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-96 rounded-xl bg-gray-200 animate-pulse" />
            <div className="h-96 rounded-xl bg-gray-200 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )

  // Staff Dashboard Skeleton
  const StaffDashboardSkeleton = () => (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="h-32 w-full rounded-2xl bg-gradient-to-r from-blue-200 to-blue-100 animate-pulse" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 rounded-xl bg-gray-200 animate-pulse" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-96 rounded-xl bg-gray-200 animate-pulse" />
            <div className="h-96 rounded-xl bg-gray-200 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )

  // Student Dashboard Skeleton
  const StudentDashboardSkeleton = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="h-40 w-full rounded-2xl bg-gradient-to-r from-blue-200 to-blue-100 animate-pulse" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 rounded-xl bg-gray-200 animate-pulse" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="h-8 w-40 bg-gray-200 rounded animate-pulse" />
              {[1, 2, 3].map(i => (
                <div key={i} className="p-4 border rounded-xl bg-white">
                  <div className="space-y-3">
                    <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                    <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-xl bg-white">
                  <div className="space-y-2">
                    <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="h-8 w-20 bg-gray-200 rounded-full animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Exams Page Skeleton
  const ExamsPageSkeleton = () => (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="p-4 border rounded-xl bg-white space-y-3">
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  // Results Page Skeleton
  const ResultsPageSkeleton = () => (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="h-8 w-40 bg-gray-200 rounded animate-pulse" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-xl bg-white">
                <div className="space-y-2">
                  <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-8 w-20 bg-gray-200 rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  // Profile Page Skeleton
  const ProfilePageSkeleton = () => (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-4">
            <div className="h-32 w-32 rounded-full bg-gray-200 animate-pulse mx-auto" />
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mx-auto" />
            <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse" />
          </div>
          <div className="md:col-span-2 space-y-4">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )

  // Home Page Skeleton
  const HomePageSkeleton = () => (
    <div className="min-h-screen bg-white pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="h-96 w-full rounded-2xl bg-gradient-to-r from-gray-200 to-gray-100 animate-pulse" />
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 rounded-xl bg-gray-200 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  // Portal/Login Page Skeleton
  const PortalPageSkeleton = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-md mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="h-24 w-24 rounded-full bg-gray-200 animate-pulse mx-auto" />
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mx-auto" />
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mx-auto" />
          <div className="space-y-4">
            <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )

  // Default Page Skeleton
  const DefaultPageSkeleton = () => (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 rounded-xl bg-gray-200 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {getSkeletonForRoute()}
        </motion.div>
      ) : (
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}