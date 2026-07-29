// src/components/student/exams/ExamsSkeleton.tsx - FIXED VERSION

import { Skeleton } from '@/components/ui/skeleton'

interface ExamsSkeletonProps {
  variant?: 'grid' | 'list'  // ✅ Support both view modes
  cardCount?: number         // ✅ Dynamic card count
}

export function ExamsSkeleton({ 
  variant = 'grid', 
  cardCount = 6 
}: ExamsSkeletonProps) {
  return (
    <div className="min-h-screen pt-16 sm:pt-20 lg:pt-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          {/* Breadcrumb skeleton */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-16" />
          </div>
          
          {/* Header skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          
          {/* Progress card skeleton */}
          <Skeleton className="h-32 w-full rounded-xl" />
          
          {/* Filter chips skeleton */}
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-10 w-24 rounded-full" />
            ))}
          </div>
          
          {/* Tabs skeleton */}
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-10 w-28 rounded-lg" />
            ))}
          </div>
          
          {/* Cards skeleton - dynamic grid/list */}
          <div className={variant === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6'
            : 'flex flex-col gap-4 max-w-4xl'
          }>
            {Array.from({ length: cardCount }).map((_, i) => (
              <div key={i} className={variant === 'list' ? 'flex flex-col sm:flex-row gap-4' : ''}>
                <Skeleton 
                  className={variant === 'grid' 
                    ? 'h-72 rounded-xl' 
                    : 'h-24 rounded-xl flex-1'
                  } 
                />
                {variant === 'list' && (
                  <div className="flex flex-col gap-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <div className="flex gap-4">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Bottom spacing */}
          <div className="h-4" />
        </div>
      </div>
    </div>
  )
}