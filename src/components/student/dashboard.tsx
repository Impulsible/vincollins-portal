// src/components/student/dashboard.tsx
'use client'

import { Skeleton } from '@/components/ui/skeleton'

export function DashboardSkeleton() {
  return (
    <div className="w-full px-3 sm:px-4 md:px-5 lg:px-6 py-3 sm:py-4 space-y-4 sm:space-y-6">
      {/* Welcome Banner Skeleton */}
      <Skeleton className="h-48 w-full rounded-2xl" />
      
      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-20 sm:h-24 w-full rounded-xl" />
        ))}
      </div>
      
      {/* Main Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
        <div className="space-y-4 sm:space-y-6">
          <Skeleton className="h-80 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}