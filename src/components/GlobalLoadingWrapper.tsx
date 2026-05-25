/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { ReactNode } from 'react'

// ✅ SIMPLE VERSION - No skeletons, no loading states, no prefetching
// This completely eliminates the "Loading your learning experience" stuck skeleton issue
export function GlobalLoadingWrapper({ children }: { children: ReactNode }) {
  // Simply return children - no loading wrappers, no animations, no prefetching
  // The AuthGuard and individual dashboards handle their own loading states
  return <>{children}</>
}