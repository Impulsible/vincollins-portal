"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { toast } from "sonner"

interface UseNetworkStatusOptions {
  /** Show toast notifications for network changes */
  showToasts?: boolean
  /** Delay in ms before showing online toast (prevents flapping) */
  onlineDebounceDelay?: number
  /** Delay in ms before showing offline toast */
  offlineDebounceDelay?: number
  /** Custom messages */
  messages?: {
    online?: string
    offline?: string
    restored?: string
  }
}

interface UseNetworkStatusReturn {
  /** Current online status */
  isOnline: boolean
  /** Number of network interruptions detected */
  interruptionCount: number
  /** Time since last interruption in seconds */
  timeSinceLastInterruption: number
  /** Force check network status */
  checkStatus: () => void
  /** Reset interruption count */
  resetInterruptionCount: () => void
}

export function useNetworkStatus({
  showToasts = true,
  onlineDebounceDelay = 2000,
  offlineDebounceDelay = 1000,
  messages = {},
}: UseNetworkStatusOptions = {}): UseNetworkStatusReturn {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [interruptionCount, setInterruptionCount] = useState(0)
  const [lastInterruptionTime, setLastInterruptionTime] = useState<number>(0)
  
  const onlineTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const offlineTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const wasOfflineRef = useRef(false)
  const mountRef = useRef(true)

  const defaultMessages = {
    online: '✅ Network connection restored!',
    offline: '⚠️ Network connection lost! Your answers are being saved locally.',
    restored: '🔄 Network restored - Syncing your progress...',
    ...messages,
  }

  const checkStatus = useCallback(() => {
    const currentStatus = navigator.onLine
    if (currentStatus !== isOnline) {
      setIsOnline(currentStatus)
      if (!currentStatus) {
        setInterruptionCount(prev => prev + 1)
        setLastInterruptionTime(Date.now())
      }
    }
    return currentStatus
  }, [isOnline])

  const resetInterruptionCount = useCallback(() => {
    setInterruptionCount(0)
    setLastInterruptionTime(0)
  }, [])

  const getTimeSinceLastInterruption = useCallback(() => {
    if (lastInterruptionTime === 0) return 0
    return Math.floor((Date.now() - lastInterruptionTime) / 1000)
  }, [lastInterruptionTime])

  useEffect(() => {
    const handleOnline = () => {
      // Clear any pending offline toasts
      if (offlineTimeoutRef.current) {
        clearTimeout(offlineTimeoutRef.current)
        offlineTimeoutRef.current = null
      }

      // Debounce online status to prevent flapping
      if (onlineTimeoutRef.current) {
        clearTimeout(onlineTimeoutRef.current)
      }

      onlineTimeoutRef.current = setTimeout(() => {
        if (!mountRef.current) return
        
        const wasOffline = wasOfflineRef.current
        setIsOnline(true)
        
        if (wasOffline && showToasts) {
          toast.success(defaultMessages.online)
          
          // If there were interruptions, show sync message
          if (interruptionCount > 0) {
            toast.info(defaultMessages.restored)
          }
        }
        
        wasOfflineRef.current = false
        onlineTimeoutRef.current = null
      }, onlineDebounceDelay)
    }

    const handleOffline = () => {
      // Clear any pending online toasts
      if (onlineTimeoutRef.current) {
        clearTimeout(onlineTimeoutRef.current)
        onlineTimeoutRef.current = null
      }

      // Debounce offline status
      if (offlineTimeoutRef.current) {
        clearTimeout(offlineTimeoutRef.current)
      }

      offlineTimeoutRef.current = setTimeout(() => {
        if (!mountRef.current) return
        
        wasOfflineRef.current = true
        setIsOnline(false)
        setInterruptionCount(prev => prev + 1)
        setLastInterruptionTime(Date.now())
        
        if (showToasts) {
          toast.warning(defaultMessages.offline, {
            duration: 4000,
          })
        }
        
        offlineTimeoutRef.current = null
      }, offlineDebounceDelay)
    }

    // Set initial status
    setIsOnline(navigator.onLine)
    wasOfflineRef.current = !navigator.onLine

    // Add event listeners with passive option for performance
    window.addEventListener('online', handleOnline, { passive: true })
    window.addEventListener('offline', handleOffline, { passive: true })

    // Check status periodically (for browsers that don't fire events reliably)
    const interval = setInterval(() => {
      if (!mountRef.current) return
      const currentStatus = navigator.onLine
      
      if (currentStatus !== isOnline) {
        if (currentStatus) {
          handleOnline()
        } else {
          handleOffline()
        }
      }
    }, 30000) // Check every 30 seconds

    return () => {
      mountRef.current = false
      if (onlineTimeoutRef.current) {
        clearTimeout(onlineTimeoutRef.current)
        onlineTimeoutRef.current = null
      }
      if (offlineTimeoutRef.current) {
        clearTimeout(offlineTimeoutRef.current)
        offlineTimeoutRef.current = null
      }
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [showToasts, onlineDebounceDelay, offlineDebounceDelay, defaultMessages, interruptionCount, isOnline])

  // Sync interruption count with state
  useEffect(() => {
    if (!isOnline) {
      // Count interruption when going offline
      setInterruptionCount(prev => prev + 1)
      setLastInterruptionTime(Date.now())
    }
  }, [isOnline])

  return {
    isOnline,
    interruptionCount,
    timeSinceLastInterruption: getTimeSinceLastInterruption(),
    checkStatus,
    resetInterruptionCount,
  }
}