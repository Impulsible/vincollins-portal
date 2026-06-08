// src/hooks/useSessionRecovery.ts
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface SessionRecoveryOptions {
  autoRecover?: boolean
  maxRetries?: number
  retryDelay?: number
  onRecoverySuccess?: () => void
  onRecoveryFailure?: (error: Error) => void
}

interface SessionRecoveryState {
  isRecovering: boolean
  recoveryAttempts: number
  lastRecoveryTime: number | null
  isSessionValid: boolean
  recoveryError: Error | null
}

const RECOVERY_STORAGE_KEY = 'app_session_recovery'
const MAX_RECOVERY_ATTEMPTS = 5
const BASE_RECOVERY_DELAY = 2000 // 2 seconds
const SESSION_CHECK_INTERVAL = 5 * 60 * 1000 // 5 minutes

export function useSessionRecovery(options: SessionRecoveryOptions = {}) {
  const {
    autoRecover = true,
    maxRetries = MAX_RECOVERY_ATTEMPTS,
    retryDelay = BASE_RECOVERY_DELAY,
    onRecoverySuccess,
    onRecoveryFailure
  } = options

  const router = useRouter()
  const [state, setState] = useState<SessionRecoveryState>({
    isRecovering: false,
    recoveryAttempts: 0,
    lastRecoveryTime: null,
    isSessionValid: true,
    recoveryError: null
  })
  
  const recoveryInProgressRef = useRef(false)
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)

  // Save recovery state to localStorage
  const saveRecoveryState = useCallback((recoveryState: Partial<SessionRecoveryState>) => {
    try {
      const currentState = JSON.parse(localStorage.getItem(RECOVERY_STORAGE_KEY) || '{}')
      const newState = { ...currentState, ...recoveryState, lastUpdated: Date.now() }
      localStorage.setItem(RECOVERY_STORAGE_KEY, JSON.stringify(newState))
    } catch (error) {
      console.error('Error saving recovery state:', error)
    }
  }, [])

  // Load recovery state from localStorage
  const loadRecoveryState = useCallback((): Partial<SessionRecoveryState> => {
    try {
      const saved = localStorage.getItem(RECOVERY_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        // Check if saved state is recent (within last hour)
        if (parsed.lastUpdated && Date.now() - parsed.lastUpdated < 60 * 60 * 1000) {
          return parsed
        }
      }
    } catch (error) {
      console.error('Error loading recovery state:', error)
    }
    return {}
  }, [])

  // Check if session is valid
  const checkSessionValidity = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Session check error:', error)
        return false
      }
      
      if (!session) {
        return false
      }
      
      // Check if session is expired
      const expiresAt = session.expires_at
      if (expiresAt && expiresAt * 1000 < Date.now()) {
        return false
      }
      
      return true
    } catch (error) {
      console.error('Session validity check failed:', error)
      return false
    }
  }, [])

  // Attempt to refresh the session
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      
      if (error) {
        console.error('Session refresh error:', error)
        return false
      }
      
      if (data.session) {
        return true
      }
      
      return false
    } catch (error) {
      console.error('Session refresh failed:', error)
      return false
    }
  }, [])

  // Attempt to recover session with retry logic
  const recoverSession = useCallback(async (): Promise<boolean> => {
    if (recoveryInProgressRef.current) {
      console.log('Recovery already in progress')
      return false
    }

    recoveryInProgressRef.current = true
    
    setState(prev => ({ 
      ...prev, 
      isRecovering: true, 
      recoveryError: null 
    }))

    let attempts = 0
    let success = false

    while (attempts < maxRetries && !success && mountedRef.current) {
      attempts++
      
      setState(prev => ({ ...prev, recoveryAttempts: attempts }))
      saveRecoveryState({ recoveryAttempts: attempts, isRecovering: true })

      try {
        // First check if session is still valid
        const isValid = await checkSessionValidity()
        
        if (isValid) {
          success = true
          break
        }

        // Try to refresh the session
        const refreshed = await refreshSession()
        
        if (refreshed) {
          success = true
          break
        }

        // If refresh failed, wait before retry
        if (attempts < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempts))
        }
      } catch (error) {
        console.error(`Recovery attempt ${attempts} failed:`, error)
        
        if (attempts === maxRetries) {
          setState(prev => ({ 
            ...prev, 
            recoveryError: error instanceof Error ? error : new Error('Recovery failed')
          }))
        }
      }
    }

    if (success) {
      setState(prev => ({ 
        ...prev, 
        isRecovering: false, 
        isSessionValid: true,
        lastRecoveryTime: Date.now(),
        recoveryAttempts: 0
      }))
      saveRecoveryState({ 
        isRecovering: false, 
        isSessionValid: true, 
        lastRecoveryTime: Date.now(),
        recoveryAttempts: 0 
      })
      onRecoverySuccess?.()
    } else {
      setState(prev => ({ 
        ...prev, 
        isRecovering: false, 
        isSessionValid: false
      }))
      saveRecoveryState({ 
        isRecovering: false, 
        isSessionValid: false 
      })
      const error = new Error('Failed to recover session after multiple attempts')
      onRecoveryFailure?.(error)
    }

    recoveryInProgressRef.current = false
    return success
  }, [maxRetries, retryDelay, checkSessionValidity, refreshSession, saveRecoveryState, onRecoverySuccess, onRecoveryFailure])

  // Handle session recovery on page visibility change
  const handleVisibilityChange = useCallback(async () => {
    if (!document.hidden && autoRecover) {
      const isValid = await checkSessionValidity()
      if (!isValid) {
        console.log('Session invalid on tab focus, attempting recovery...')
        await recoverSession()
      }
    }
  }, [autoRecover, checkSessionValidity, recoverSession])

  // Handle online/offline events
  const handleOnline = useCallback(async () => {
    console.log('Device online, checking session...')
    const isValid = await checkSessionValidity()
    if (!isValid && autoRecover) {
      await recoverSession()
    }
  }, [autoRecover, checkSessionValidity, recoverSession])

  const handleOffline = useCallback(() => {
    console.log('Device offline')
    toast.warning('You are offline. Some features may be unavailable.', {
      id: 'offline-warning',
      duration: 3000
    })
  }, [])

  // Force logout and clear session
  const forceLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      
      // Clear all recovery data
      localStorage.removeItem(RECOVERY_STORAGE_KEY)
      sessionStorage.clear()
      
      setState({
        isRecovering: false,
        recoveryAttempts: 0,
        lastRecoveryTime: null,
        isSessionValid: false,
        recoveryError: null
      })
      
      toast.info('Session cleared. Please sign in again.')
      router.push('/portal')
      router.refresh()
    } catch (error) {
      console.error('Force logout error:', error)
      toast.error('Failed to clear session')
    }
  }, [router])

  // Periodic session check
  useEffect(() => {
    if (autoRecover) {
      // Check session periodically
      checkIntervalRef.current = setInterval(async () => {
        const isValid = await checkSessionValidity()
        
        if (!isValid && mountedRef.current) {
          setState(prev => ({ ...prev, isSessionValid: false }))
          
          // Attempt recovery in background
          if (!recoveryInProgressRef.current) {
            await recoverSession()
          }
        } else if (isValid && mountedRef.current) {
          setState(prev => ({ ...prev, isSessionValid: true }))
        }
      }, SESSION_CHECK_INTERVAL)

      // Listen to visibility changes
      document.addEventListener('visibilitychange', handleVisibilityChange)
      
      // Listen to online/offline events
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
    }

    return () => {
      mountedRef.current = false
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [autoRecover, checkSessionValidity, recoverSession, handleVisibilityChange, handleOnline, handleOffline])

  // Load saved recovery state on mount
  useEffect(() => {
    const savedState = loadRecoveryState()
    if (savedState) {
      setState(prev => ({
        ...prev,
        recoveryAttempts: savedState.recoveryAttempts || 0,
        lastRecoveryTime: savedState.lastRecoveryTime || null,
        isSessionValid: savedState.isSessionValid !== undefined ? savedState.isSessionValid : true
      }))
    }
  }, [loadRecoveryState])

  return {
    ...state,
    recoverSession,
    checkSessionValidity,
    refreshSession,
    forceLogout,
    isRecoverable: state.recoveryAttempts < maxRetries
  }
}