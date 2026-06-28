// src/hooks/useTwoStageSplash.ts

'use client'

import { useState, useEffect, useCallback } from 'react'

interface SplashState {
  stage: 'logo' | 'main' | 'hidden'
  progress: number
}

export function useTwoStageSplash(logoDuration: number = 3000) {
  const [state, setState] = useState<SplashState>({
    stage: 'logo',
    progress: 0,
  })

  useEffect(() => {
    if (state.stage === 'logo') {
      const timer = setTimeout(() => {
        setState(prev => ({ ...prev, stage: 'main' }))
      }, logoDuration)
      return () => clearTimeout(timer)
    }
  }, [state.stage, logoDuration])

  useEffect(() => {
    if (state.stage === 'main') {
      let currentProgress = 0
      const interval = setInterval(() => {
        currentProgress += Math.random() * 8 + 2
        if (currentProgress >= 100) {
          currentProgress = 100
          clearInterval(interval)
        }
        setState(prev => ({ ...prev, progress: Math.min(currentProgress, 100) }))
      }, 150)
      return () => clearInterval(interval)
    }
  }, [state.stage])

  const hideSplash = useCallback(() => {
    setState(prev => ({ ...prev, stage: 'hidden' }))
  }, [])

  const resetSplash = useCallback(() => {
    setState({ stage: 'logo', progress: 0 })
  }, [])

  return {
    ...state,
    hideSplash,
    resetSplash,
    isVisible: state.stage !== 'hidden',
  }
}