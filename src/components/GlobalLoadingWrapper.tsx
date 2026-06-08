// src/components/GlobalLoadingWrapper.tsx
'use client'

import { ReactNode } from 'react'

// SIMPLE - No loading logic, just render children
export function GlobalLoadingWrapper({ children }: { children: ReactNode }) {
  return <>{children}</>
}