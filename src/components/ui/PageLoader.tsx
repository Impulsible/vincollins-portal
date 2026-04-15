/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { LoadingSpinner } from './LoadingSpinner'

interface PageLoaderProps {
  message?: string
}

export function PageLoader({ message = 'Loading...' }: PageLoaderProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-primary/10 animate-pulse" />
          </div>
        </div>
        <div>
          <p className="text-muted-foreground animate-pulse">{message}</p>
        </div>
      </div>
    </div>
  )
}