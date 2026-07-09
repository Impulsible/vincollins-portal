"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { toast } from "sonner" // ✅ Fixed: Import toast

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
  const [lastInterruptionTime, setLastInterruptionTime] = useState(Date.now())
  
  // ✅ Use refs to track state without causing re-renders
  const onlineTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const offlineTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const wasOfflineRef = useRef(!navigator.onLine)
  const mountRef = useRef(true)
  const isProcessingOfflineRef = useRef(false) // ✅ Prevent duplicate offline events
  const isProcessingOnlineRef = useRef(false)  // ✅ Prevent duplicate online events

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
    setLastInterruptionTime(Date.now())
  }, [])

  const getTimeSinceLastInterruption = useCallback(() => {
    if (lastInterruptionTime === 0) return 0
    return Math.floor((Date.now() - lastInterruptionTime) / 1000)
  }, [lastInterruptionTime])

  // Handle online event
  const handleOnline = useCallback(() => {
    // Prevent duplicate processing
    if (isProcessingOnlineRef.current) return
    isProcessingOnlineRef.current = true

    // Clear any pending offline toasts
    if (offlineTimeoutRef.current) {
      clearTimeout(offlineTimeoutRef.current)
      offlineTimeoutRef.current = null
    }

    // Clear any pending online timeout
    if (onlineTimeoutRef.current) {
      clearTimeout(onlineTimeoutRef.current)
    }

    onlineTimeoutRef.current = setTimeout(() => {
      if (!mountRef.current) {
        isProcessingOnlineRef.current = false
        return
      }
      
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
      isProcessingOnlineRef.current = false
    }, onlineDebounceDelay)
  }, [interruptionCount, showToasts, defaultMessages, onlineDebounceDelay])

  // Handle offline event
  const handleOffline = useCallback(() => {
    // Prevent duplicate processing
    if (isProcessingOfflineRef.current) return
    isProcessingOfflineRef.current = true

    // Clear any pending online toasts
    if (onlineTimeoutRef.current) {
      clearTimeout(onlineTimeoutRef.current)
      onlineTimeoutRef.current = null
    }

    // Clear any pending offline timeout
    if (offlineTimeoutRef.current) {
      clearTimeout(offlineTimeoutRef.current)
    }

    offlineTimeoutRef.current = setTimeout(() => {
      if (!mountRef.current) {
        isProcessingOfflineRef.current = false
        return
      }
      
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
      isProcessingOfflineRef.current = false
    }, offlineDebounceDelay)
  }, [showToasts, defaultMessages, offlineDebounceDelay])

  // ✅ Track time since last interruption with interval
  const [timeSinceLastInterruption, setTimeSinceLastInterruption] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSinceLastInterruption(getTimeSinceLastInterruption())
    }, 1000)

    return () => clearInterval(interval)
  }, [getTimeSinceLastInterruption])

  // Initial setup and event listeners
  useEffect(() => {
    // Set initial status
    const initialStatus = navigator.onLine
    setIsOnline(initialStatus)
    wasOfflineRef.current = !initialStatus
    if (!initialStatus) {
      setInterruptionCount(1)
      setLastInterruptionTime(Date.now())
    }

    // Add event listeners
    window.addEventListener('online', handleOnline, { passive: true })
    window.addEventListener('offline', handleOffline, { passive: true })

    // ✅ Check status periodically (but don't trigger duplicate events)
    const interval = setInterval(() => {
      if (!mountRef.current) return
      
      const currentStatus = navigator.onLine
      const currentIsOnline = isOnline
      
      // Only update if status actually changed and we're not already processing
      if (currentStatus !== currentIsOnline) {
        if (currentStatus && !isProcessingOnlineRef.current) {
          handleOnline()
        } else if (!currentStatus && !isProcessingOfflineRef.current) {
          handleOffline()
        }
      }
    }, 30000)

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
  }, [handleOnline, handleOffline, isOnline])

  return {
    isOnline,
    interruptionCount,
    timeSinceLastInterruption,
    checkStatus,
    resetInterruptionCount,
  }
}