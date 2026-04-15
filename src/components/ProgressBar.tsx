// components/ProgressBar.tsx
'use client'

import { Suspense, useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import NProgress from 'nprogress'

// Import styles
import 'nprogress/nprogress.css'

// Configure NProgress
NProgress.configure({ 
  showSpinner: false,
  speed: 300,
  trickleSpeed: 200,
  minimum: 0.2,
  easing: 'ease',
  parent: 'body',
})

function ProgressBarContent() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    NProgress.done()
    return () => {
      NProgress.start()
    }
  }, [pathname, searchParams])

  return null
}

export function ProgressBar() {
  return (
    <Suspense fallback={null}>
      <ProgressBarContent />
    </Suspense>
  )
}