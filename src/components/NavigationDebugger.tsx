// components/NavigationDebugger.tsx - FIXED EXPORT

'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function NavigationDebugger() {
  const pathname = usePathname()

  useEffect(() => {
    console.log('🔴 NAVIGATION DEBUG - Path changed to:', pathname)
    console.log('🔴 NAVIGATION DEBUG - Full URL:', window.location.href)
    console.log('🔴 NAVIGATION DEBUG - Referrer:', document.referrer)
    
    // Log if this is a redirect from submissions
    if (pathname === '/staff/exams' && document.referrer?.includes('/submissions')) {
      console.warn('🔴🔴🔴 REDIRECT DETECTED: From submissions back to /staff/exams')
      console.trace('🔴🔴🔴 REDIRECT STACK TRACE:')
    }
  }, [pathname])

  return null
}

// ✅ Also add default export for safety
export default NavigationDebugger