// src/components/GlobalLoadingWrapper.tsx
'use client'

import { ReactNode, useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

// Top progress bar that shows during route transitions
function RouteProgressBar({ active }: { active: boolean }) {
  const [width, setWidth] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (active) {
      setVisible(true)
      setWidth(0)
      // Simulate progress
      const t1 = setTimeout(() => setWidth(30), 50)
      const t2 = setTimeout(() => setWidth(60), 200)
      const t3 = setTimeout(() => setWidth(85), 500)
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
    } else {
      setWidth(100)
      const t = setTimeout(() => { setVisible(false); setWidth(0) }, 400)
      return () => clearTimeout(t)
    }
  }, [active])

  if (!visible) return null

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-[99999] h-0.5',
        'bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400',
        'transition-all duration-300 ease-out',
        'shadow-sm shadow-emerald-500/50',
      )}
      style={{ width: `${width}%` }}
    />
  )
}

export function GlobalLoadingWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isNavigating, setIsNavigating] = useState(false)
  const [prevPath, setPrevPath] = useState('')

  useEffect(() => {
    const currentPath = pathname + searchParams.toString()

    if (prevPath && prevPath !== currentPath) {
      // Navigation started
      setIsNavigating(true)

      // Navigation complete (Next.js doesn't expose a "complete" event
      // so we use a short timeout — the component re-renders when done)
      const t = setTimeout(() => setIsNavigating(false), 500)
      return () => clearTimeout(t)
    }

    setPrevPath(currentPath)
  }, [pathname, searchParams, prevPath])

  return (
    <>
      <RouteProgressBar active={isNavigating} />
      {children}
    </>
  )
}