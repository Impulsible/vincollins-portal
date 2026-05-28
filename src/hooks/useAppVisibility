// hooks/useAppVisibility.ts
'use client'

import { useEffect, useRef, useCallback } from 'react'

interface UseAppVisibilityOptions {
  onBackground?: () => void
  onForeground?: () => void
  preventAutoRefresh?: boolean
}

export function useAppVisibility({
  onBackground,
  onForeground,
  preventAutoRefresh = true
}: UseAppVisibilityOptions = {}) {
  const isVisibleRef = useRef(true)
  const preventRefreshRef = useRef(preventAutoRefresh)

  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible'
      
      if (isVisible === isVisibleRef.current) return
      
      isVisibleRef.current = isVisible
      
      if (!isVisible) {
        // App went to background
        onBackground?.()
      } else {
        // App came to foreground
        // ONLY call onForeground - NO auto refresh
        onForeground?.()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [onBackground, onForeground])

  return {
    isVisible: isVisibleRef.current,
    wasInBackground: useRef(false)
  }
}