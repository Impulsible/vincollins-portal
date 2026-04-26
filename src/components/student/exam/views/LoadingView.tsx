// src/components/student/exam/views/LoadingView.tsx
import { Loader2, Shield } from 'lucide-react'

export function LoadingView() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="relative inline-flex mb-6">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Shield className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <Loader2 className="h-6 w-6 animate-spin text-primary absolute -bottom-1 -right-1" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Loading Exam Environment
        </h2>
        <p className="text-sm text-gray-500 max-w-xs mx-auto">
          Preparing your secure exam interface...
        </p>
        <div className="mt-6 flex justify-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  )
}