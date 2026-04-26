// src/components/student/exams/ExamsSkeleton.tsx
import { Skeleton } from '@/components/ui/skeleton'

export function ExamsSkeleton() {
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
          
          {/* Title skeleton */}
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
          
          {/* Progress card skeleton */}
          <Skeleton className="h-32 w-full rounded-xl" />
          
          {/* Filter chips skeleton */}
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-10 w-24 rounded-full" />
            ))}
          </div>
          
          {/* Tabs skeleton */}
          <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-10 w-32 rounded-lg" />
            ))}
          </div>
          
          {/* Cards skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-72 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}