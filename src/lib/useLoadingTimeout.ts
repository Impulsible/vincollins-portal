'use client'

import { useState, useEffect } from 'react'

export function useLoadingTimeout(loading: boolean, timeout = 8000) {
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    if (!loading) {
      setTimedOut(false)
      return
    }
    const timer = setTimeout(() => setTimedOut(true), timeout)
    return () => clearTimeout(timer)
  }, [loading, timeout])

  return timedOut
}