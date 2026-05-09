'use client'

import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SafeSkeletonProps {
  loading: boolean
  timeout?: number
  onRetry?: () => void
  children: React.ReactNode
  skeleton: React.ReactNode
}

export function SafeSkeleton({ 
  loading, 
  timeout = 8000, 
  onRetry, 
  children,
  skeleton 
}: SafeSkeletonProps) {
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    if (!loading) { setTimedOut(false); return }
    const timer = setTimeout(() => setTimedOut(true), timeout)
    return () => clearTimeout(timer)
  }, [loading, timeout])

  if (!loading) return <>{children}</>

  if (timedOut) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-sm text-gray-500">Loading is taking too long...</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        )}
      </div>
    )
  }

  return <>{skeleton}</>
}