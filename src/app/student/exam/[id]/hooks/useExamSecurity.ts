"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { TAB_SWITCH_LIMIT, FULLSCREEN_EXIT_LIMIT } from "../constants"

// Type definitions
interface BatteryManager {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
  addEventListener: (type: string, listener: EventListener) => void;
  removeEventListener: (type: string, listener: EventListener) => void;
}

interface PendingUpdate {
  attemptId: string;
  type: 'tab' | 'fullscreen' | 'network' | 'display';
  count: number;
  timestamp: number;
}

interface SecurityState {
  tabSwitches: number;
  fullscreenExits: number;
  networkWarnings: number;
  displayOffCount: number;
  reloadCount: number;
  lastReloadTime: number;
  timestamp: number;
  isSystemSleeping: boolean;
}

export function useExamSecurity(
  examStarted: boolean,
  examEndedRef: React.MutableRefObject<boolean>,
  onViolation: () => void,
  initialTabSwitches: number = 0,
  initialFullscreenExits: number = 0,
  attemptId?: string | null
) {
  const [tabSwitches, setTabSwitches] = useState(initialTabSwitches)
  const [fullscreenExits, setFullscreenExits] = useState(initialFullscreenExits)
  const [fullscreen, setFullscreen] = useState(false)
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(false)
  const [securityViolated, setSecurityViolated] = useState(false)
  const [examTerminated, setExamTerminated] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [networkWarnings, setNetworkWarnings] = useState(0)
  const [isSystemSleeping, setIsSystemSleeping] = useState(false)
  const [displayOffCount, setDisplayOffCount] = useState(0)
  
  const violationRef = useRef(false)
  const blurCountRef = useRef(0)
  const attemptIdRef = useRef(attemptId)
  const lastNetworkWarningRef = useRef<number>(0)
  const reloadCountRef = useRef(0)
  const maxReloads = 3
  const reloadWindowMs = 60000
  
  // System event tracking
  const lastVisibilityChangeRef = useRef<number>(Date.now())
  const visibilityTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isSystemSleepRef = useRef(false)
  const displayOffStartTimeRef = useRef<number | null>(null)
  const lastUserActivityRef = useRef<number>(Date.now())
  const isUserActiveRef = useRef(true)
  
  // Grace period for system events (in milliseconds)
  const SYSTEM_EVENT_GRACE_PERIOD = 5000 // 5 seconds grace period
  const DISPLAY_OFF_GRACE_PERIOD = 30000 // 30 seconds for display sleep
  
  // Use useRef for storage key since it changes with attemptId
  const getStorageKey = useCallback(() => {
    return `exam_security_${attemptIdRef.current || 'default'}`
  }, [])

  // Save state to sessionStorage on changes
  const saveSecurityState = useCallback(() => {
    if (!attemptIdRef.current) return
    try {
      const state: SecurityState = {
        tabSwitches,
        fullscreenExits,
        networkWarnings,
        displayOffCount,
        reloadCount: reloadCountRef.current,
        lastReloadTime: Date.now(),
        timestamp: Date.now(),
        isSystemSleeping: isSystemSleepRef.current
      }
      sessionStorage.setItem(getStorageKey(), JSON.stringify(state))
    } catch (e) {
      console.error('Failed to save security state:', e)
    }
  }, [tabSwitches, fullscreenExits, networkWarnings, displayOffCount, getStorageKey])

  // Restore state from sessionStorage on mount/reload
  const restoreSecurityState = useCallback(() => {
    if (!attemptIdRef.current) return
    try {
      const stored = sessionStorage.getItem(getStorageKey())
      if (stored) {
        const data: SecurityState = JSON.parse(stored)
        const timeSinceLastReload = Date.now() - (data.lastReloadTime || 0)
        
        if (timeSinceLastReload < 300000) {
          setTabSwitches(data.tabSwitches || 0)
          setFullscreenExits(data.fullscreenExits || 0)
          setNetworkWarnings(data.networkWarnings || 0)
          setDisplayOffCount(data.displayOffCount || 0)
          reloadCountRef.current = data.reloadCount || 0
          isSystemSleepRef.current = data.isSystemSleeping || false
          
          if (data.tabSwitches >= TAB_SWITCH_LIMIT || 
              data.fullscreenExits >= FULLSCREEN_EXIT_LIMIT) {
            handleViolation("Security limit reached before reload")
          }
        } else {
          sessionStorage.removeItem(getStorageKey())
        }
      }
    } catch (e) {
      console.error('Failed to restore security state:', e)
    }
  }, [getStorageKey])

  // Restore on mount
  useEffect(() => {
    if (examStarted) {
      restoreSecurityState()
    }
  }, [examStarted, restoreSecurityState])

  const persistViolation = async (type: 'tab' | 'fullscreen' | 'network' | 'display', count: number) => {
    if (!attemptIdRef.current) return
    
    const maxRetries = 3
    let retries = 0
    
    const updateData = type === 'tab' 
      ? { tab_switches: count }
      : type === 'fullscreen'
      ? { fullscreen_exits: count }
      : type === 'network'
      ? { network_warnings: count }
      : { display_off_count: count }

    while (retries < maxRetries) {
      try {
        const { error } = await supabase
          .from('exam_attempts')
          .update(updateData)
          .eq('id', attemptIdRef.current)
        
        if (error) throw error
        
        saveSecurityState()
        return
      } catch (e) {
        retries++
        console.error(`Failed to persist violation (attempt ${retries}/${maxRetries}):`, e)
        
        if (retries === maxRetries) {
          try {
            const pendingUpdates: PendingUpdate[] = JSON.parse(localStorage.getItem('pending_exam_updates') || '[]')
            pendingUpdates.push({
              attemptId: attemptIdRef.current,
              type,
              count,
              timestamp: Date.now()
            })
            localStorage.setItem('pending_exam_updates', JSON.stringify(pendingUpdates))
            
            toast.warning("Network issue - Your progress is saved locally and will sync when connection returns")
          } catch (err) {
            console.error('Failed to store pending update:', err)
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)))
      }
    }
  }

  // Sync pending updates when network reconnects
  const syncPendingUpdates = useCallback(async () => {
    try {
      const pending: PendingUpdate[] = JSON.parse(localStorage.getItem('pending_exam_updates') || '[]')
      if (pending.length === 0) return

      toast.info(`Syncing ${pending.length} pending updates...`)
      
      for (const update of pending) {
        try {
          const { error } = await supabase
            .from('exam_attempts')
            .update(
              update.type === 'tab' 
                ? { tab_switches: update.count }
                : update.type === 'fullscreen'
                ? { fullscreen_exits: update.count }
                : update.type === 'network'
                ? { network_warnings: update.count }
                : { display_off_count: update.count }
            )
            .eq('id', update.attemptId)
          
          if (error) throw error
        } catch (e) {
          console.error('Failed to sync update:', e)
        }
      }
      
      localStorage.removeItem('pending_exam_updates')
      toast.success('All pending updates synced successfully')
    } catch (e) {
      console.error('Failed to sync pending updates:', e)
    }
  }, [])

  const triggerViolation = useCallback((reason: string) => {
    if (violationRef.current || examTerminated) return
    violationRef.current = true
    setSecurityViolated(true)
    setExamTerminated(true)
    
    saveSecurityState()
    
    toast.error("SECURITY VIOLATION: " + reason + " - Exam terminated!")
    setTimeout(() => onViolation(), 300)
  }, [onViolation, examTerminated, saveSecurityState])

  const handleViolation = useCallback((reason: string) => {
    triggerViolation(reason)
  }, [triggerViolation])

  // --- System Sleep Detection ---
  useEffect(() => {
    if (!examStarted || examEndedRef.current || examTerminated) return

    // Detect system sleep using visibility API and timestamps
    const handleVisibilityChange = () => {
      const now = Date.now()
      const timeSinceLastChange = now - lastVisibilityChangeRef.current
      
      // If document becomes hidden for a long time, it's likely system sleep
      if (document.hidden) {
        lastVisibilityChangeRef.current = now
        displayOffStartTimeRef.current = now
        
        // Set a timeout - if still hidden after grace period, mark as system sleep
        if (visibilityTimeoutRef.current) {
          clearTimeout(visibilityTimeoutRef.current)
        }
        
        visibilityTimeoutRef.current = setTimeout(() => {
          if (document.hidden && !examEndedRef.current && !examTerminated) {
            isSystemSleepRef.current = true
            setIsSystemSleeping(true)
            toast.warning("System sleep detected - Resuming exam...")
            
            // Track display off events
            setDisplayOffCount(prev => {
              const n = prev + 1
              persistViolation('display', n)
              if (n >= 3) {
                handleViolation("Excessive system sleep/displays off detected")
              }
              return n
            })
          }
        }, SYSTEM_EVENT_GRACE_PERIOD)
      } else {
        // Document is visible again
        if (visibilityTimeoutRef.current) {
          clearTimeout(visibilityTimeoutRef.current)
          visibilityTimeoutRef.current = null
        }
        
        if (displayOffStartTimeRef.current) {
          const sleepDuration = now - displayOffStartTimeRef.current
          displayOffStartTimeRef.current = null
          
          // If system was sleeping, resume gracefully
          if (isSystemSleepRef.current) {
            isSystemSleepRef.current = false
            setIsSystemSleeping(false)
            
            // Only warn if sleep was longer than typical display timeout
            if (sleepDuration > 10000) {
              toast.info(`Exam resumed after ${Math.round(sleepDuration/1000)}s of system sleep`)
            }
          }
        }
        
        lastVisibilityChangeRef.current = now
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current)
      }
    }
  }, [examStarted, examTerminated, examEndedRef, persistViolation, handleViolation])

  // --- User Activity Detection ---
  useEffect(() => {
    if (!examStarted || examEndedRef.current || examTerminated) return

    const handleUserActivity = () => {
      lastUserActivityRef.current = Date.now()
      isUserActiveRef.current = true
      
      // If system was marked as sleeping but user is active, reset
      if (isSystemSleepRef.current) {
        isSystemSleepRef.current = false
        setIsSystemSleeping(false)
      }
    }

    // Monitor mouse, keyboard, and touch events
    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click', 'mousemove']
    activityEvents.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true })
    })

    // Check for inactivity (might indicate system sleep or display off)
    const inactivityCheck = setInterval(() => {
      const now = Date.now()
      const timeSinceActivity = now - lastUserActivityRef.current
      
      // If no activity for > 2 minutes, user might be away
      if (timeSinceActivity > 120000 && !document.hidden && !isSystemSleepRef.current) {
        toast.warning("You've been inactive for a while. Please interact with the exam.")
      }
    }, 60000) // Check every minute

    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleUserActivity)
      })
      clearInterval(inactivityCheck)
    }
  }, [examStarted, examTerminated, examEndedRef])

  // --- Screen Sleep/Wake Detection (using Battery API and Screen Orientation) ---
  useEffect(() => {
    if (!examStarted || examEndedRef.current || examTerminated) return

    // Use Battery API to detect power state changes
    if ('getBattery' in navigator) {
      let battery: BatteryManager | null = null
      
      // Type-safe approach for getBattery
      const getBattery = (navigator as Navigator & { getBattery?: () => Promise<BatteryManager> }).getBattery
      
      if (getBattery) {
        getBattery().then((batteryManager: BatteryManager) => {
          battery = batteryManager
          // Not needed for sleep detection but helps understand device state
        }).catch(() => {
          // Battery API not available, skip
        })
      }
    }

    // Detect screen wake using visibility and orientation changes
    const handleOrientationChange = () => {
      // If orientation changes while screen was off, it's likely a wake
      if (isSystemSleepRef.current) {
        isSystemSleepRef.current = false
        setIsSystemSleeping(false)
        toast.info("Screen resumed")
      }
    }

    // Detect wake using focus events
    const handleFocus = () => {
      if (isSystemSleepRef.current) {
        isSystemSleepRef.current = false
        setIsSystemSleeping(false)
        toast.info("Exam resumed after system sleep")
      }
    }

    window.addEventListener('orientationchange', handleOrientationChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [examStarted, examTerminated, examEndedRef])

  // --- Enhanced Network Status Monitoring ---
  useEffect(() => {
    if (!examStarted || examEndedRef.current || examTerminated) return

    const handleOnline = async () => {
      setIsOnline(true)
      toast.success("Network connection restored")
      
      await syncPendingUpdates()
    }

    const handleOffline = () => {
      setIsOnline(false)
      const now = Date.now()
      
      if (now - lastNetworkWarningRef.current < 30000) return
      lastNetworkWarningRef.current = now
      
      setNetworkWarnings(prev => {
        const n = prev + 1
        persistViolation('network', n)
        
        if (n === 1) {
          toast.warning("Network connection lost! Please check your internet")
        } else if (n === 2) {
          toast.error("Network issues detected! Your answers may not be saved")
        } else if (n >= 3) {
          handleViolation("Repeated network interruptions detected")
        }
        return n
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    const connectionCheck = setInterval(() => {
      if (navigator.onLine) {
        const pending = localStorage.getItem('pending_exam_updates')
        const hasPending = pending !== null && pending !== '[]'
        if (hasPending) {
          syncPendingUpdates()
        }
      }
    }, 10000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(connectionCheck)
    }
  }, [examStarted, examTerminated, examEndedRef, syncPendingUpdates, persistViolation, handleViolation])

  // --- Enhanced Page Reload Handling ---
  useEffect(() => {
    if (!examStarted || examEndedRef.current || examTerminated) return

    const handlePageLoad = () => {
      const now = Date.now()
      
      // Use a separate ref for tracking reset time
      const resetTimeRef = { current: now }
      
      if (now - resetTimeRef.current > reloadWindowMs) {
        reloadCountRef.current = 0
        resetTimeRef.current = now
      }
      
      reloadCountRef.current++
      
      const isUserReload = performance && 
                          performance.navigation && 
                          performance.navigation.type === 1
      
      if (isUserReload) {
        const remaining = maxReloads - reloadCountRef.current
        if (reloadCountRef.current <= maxReloads) {
          toast.warning(`Page reload (${reloadCountRef.current}/${maxReloads}) - Please avoid refreshing`)
        }
        
        if (reloadCountRef.current >= maxReloads) {
          handleViolation("Excessive page reloads detected")
        }
      }
      
      saveSecurityState()
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Don't show warning if system is sleeping
      if (isSystemSleepRef.current) return
      
      saveSecurityState()
      
      if (examStarted && !examEndedRef.current && !examTerminated) {
        e.preventDefault()
        e.returnValue = "You have an exam in progress! Are you sure you want to leave?"
        return e.returnValue
      }
    }

    window.addEventListener('load', handlePageLoad)
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('unload', () => saveSecurityState())

    return () => {
      window.removeEventListener('load', handlePageLoad)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('unload', () => saveSecurityState())
    }
  }, [examStarted, examTerminated, examEndedRef, saveSecurityState, handleViolation])

  useEffect(() => {
    if (examStarted) {
      violationRef.current = false
      setExamTerminated(false)
      blurCountRef.current = 0
      setNetworkWarnings(0)
      setDisplayOffCount(0)
      setIsOnline(navigator.onLine)
      setIsSystemSleeping(false)
      isSystemSleepRef.current = false
      lastUserActivityRef.current = Date.now()
      isUserActiveRef.current = true
    }
  }, [examStarted])

  // --- Tab Switch Detection with System Sleep Awareness ---
  useEffect(() => {
    if (!examStarted || examEndedRef.current || examTerminated) return
    
    const h = () => {
      // Ignore tab switch events during system sleep
      if (isSystemSleepRef.current) {
        console.log('Tab switch during system sleep - ignoring')
        return
      }
      
      if (document.hidden && !examEndedRef.current && !examTerminated) {
        setTabSwitches(prev => {
          const n = prev + 1
          persistViolation('tab', n)
          if (n === 1) toast.warning("Tab switch! (" + n + "/" + TAB_SWITCH_LIMIT + ")")
          else if (n === 2) toast.error("Final warning! (" + n + "/" + TAB_SWITCH_LIMIT + ")")
          else if (n >= TAB_SWITCH_LIMIT) handleViolation("Tab switch limit exceeded")
          return n
        })
      }
    }
    document.addEventListener("visibilitychange", h)
    return () => document.removeEventListener("visibilitychange", h)
  }, [examStarted, examTerminated, examEndedRef, persistViolation, handleViolation])

  // --- Fullscreen Detection with System Sleep Awareness ---
  useEffect(() => {
    if (!examStarted || examEndedRef.current || examTerminated) return
    
    const h = () => {
      const fs = !!(document.fullscreenElement || (document as any).webkitFullscreenElement)
      setFullscreen(fs)
      
      // Ignore fullscreen exits during system sleep
      if (isSystemSleepRef.current) {
        console.log('Fullscreen exit during system sleep - ignoring')
        return
      }
      
      if (!fs && !examEndedRef.current && !examTerminated) {
        setFullscreenExits(prev => {
          const n = prev + 1
          persistViolation('fullscreen', n)
          if (n === 1) { 
            toast.warning("Fullscreen exit! (" + n + "/" + FULLSCREEN_EXIT_LIMIT + ")")
            setShowFullscreenPrompt(true)
          }
          else if (n === 2) { 
            toast.error("Final warning! (" + n + "/" + FULLSCREEN_EXIT_LIMIT + ")")
            setShowFullscreenPrompt(true)
          }
          else if (n >= FULLSCREEN_EXIT_LIMIT) handleViolation("Fullscreen exit limit exceeded")
          return n
        })
      }
    }
    document.addEventListener("fullscreenchange", h)
    document.addEventListener("webkitfullscreenchange", h)
    return () => {
      document.removeEventListener("fullscreenchange", h)
      document.removeEventListener("webkitfullscreenchange", h)
    }
  }, [examStarted, examTerminated, examEndedRef, persistViolation, handleViolation])

  // --- Window Blur with System Sleep Awareness ---
  useEffect(() => {
    if (!examStarted || examEndedRef.current || examTerminated) return
    
    const h = () => {
      if (examEndedRef.current || examTerminated) return
      
      // Ignore blur during system sleep
      if (isSystemSleepRef.current) {
        console.log('Window blur during system sleep - ignoring')
        return
      }
      
      blurCountRef.current++
      
      if (blurCountRef.current >= 3) {
        handleViolation("Window focus lost multiple times")
      } else if (blurCountRef.current === 1) {
        toast.warning("Window lost focus! Do not leave the exam")
      } else if (blurCountRef.current === 2) {
        toast.error("Final warning! Window focus lost again")
      }
    }
    
    window.addEventListener("blur", h)
    return () => window.removeEventListener("blur", h)
  }, [examStarted, examTerminated, examEndedRef, handleViolation])

  // --- Keyboard Blocked with System Sleep Awareness ---
  useEffect(() => {
    if (!examStarted || examTerminated) return
    
    const keydown = (e: KeyboardEvent) => {
      // Don't block keys during system sleep
      if (isSystemSleepRef.current) return
      
      const essentialShortcuts = [
        e.altKey && e.key === 'd',
        e.altKey && e.key === 'Home',
        e.ctrlKey && e.key === 'o',
        e.ctrlKey && e.key === 's'
      ]
      
      if (essentialShortcuts.some(shortcut => shortcut)) return
      
      if (e.ctrlKey && ["c","v","x","p","a","r","w","t","n","u","i"].includes(e.key.toLowerCase())) {
        e.preventDefault()
        toast.warning("Keyboard shortcut blocked")
      }
      if (e.key === "F5" || e.key === "F12" || (e.ctrlKey && e.key === "F5")) {
        e.preventDefault()
        toast.warning("Refresh blocked during exam")
      }
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
      }
    }
    
    document.addEventListener("keydown", keydown, true)
    return () => document.removeEventListener("keydown", keydown, true)
  }, [examStarted, examTerminated])

  // --- Context Menu Blocked ---
  useEffect(() => {
    if (!examStarted || examTerminated) return
    const prevent = (e: Event) => {
      // Don't block context menu during system sleep
      if (isSystemSleepRef.current) return
      e.preventDefault()
    }
    document.addEventListener("contextmenu", prevent, true)
    return () => document.removeEventListener("contextmenu", prevent, true)
  }, [examStarted, examTerminated])

  const enterFullscreen = useCallback(async () => {
    try {
      const elem = document.documentElement
      if (elem.requestFullscreen) await elem.requestFullscreen()
      else if ((elem as any).webkitRequestFullscreen) await (elem as any).webkitRequestFullscreen()
      setFullscreen(true)
      setShowFullscreenPrompt(false)
      toast.success("Fullscreen mode active")
    } catch (e) {
      toast.error("Failed to enter fullscreen mode")
    }
  }, [])

  // Clean up stored state on exam end
  useEffect(() => {
    if (examEndedRef.current || examTerminated) {
      try {
        sessionStorage.removeItem(getStorageKey())
        localStorage.removeItem('pending_exam_updates')
        if (visibilityTimeoutRef.current) {
          clearTimeout(visibilityTimeoutRef.current)
        }
      } catch (e) {
        console.error('Failed to clear security state:', e)
      }
    }
  }, [examEndedRef.current, examTerminated, getStorageKey])

  return {
    tabSwitches,
    fullscreenExits,
    fullscreen,
    setFullscreen,
    showFullscreenPrompt,
    setShowFullscreenPrompt,
    securityViolated,
    examTerminated,
    enterFullscreen,
    isOnline,
    networkWarnings,
    isSystemSleeping,
    displayOffCount,
    pendingUpdates: (() => {
      try {
        const pending: PendingUpdate[] = JSON.parse(localStorage.getItem('pending_exam_updates') || '[]')
        return pending.length
      } catch {
        return 0
      }
    })()
  }
}