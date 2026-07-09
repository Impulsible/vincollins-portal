// src/app/student/exam/[id]/hooks/useExamSecurity.ts

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

interface UseExamSecurityProps {
  examStarted: boolean;
  examEndedRef: React.MutableRefObject<boolean>;
  onViolation: () => void;
  initialTabSwitches?: number;
  initialFullscreenExits?: number;
  attemptId?: string | null;
  answers?: Record<string, string>;
  questions?: any[];
  onAutoSubmit?: (reason: string) => Promise<void>;
}

export function useExamSecurity({
  examStarted,
  examEndedRef,
  onViolation,
  initialTabSwitches = 0,
  initialFullscreenExits = 0,
  attemptId = null,
  answers = {},
  questions = [],
  onAutoSubmit,
}: UseExamSecurityProps) {
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
  const isSubmittingRef = useRef(false)
  
  // System event tracking with grace periods
  const lastVisibilityChangeRef = useRef<number>(Date.now())
  const visibilityTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isSystemSleepRef = useRef(false)
  const displayOffStartTimeRef = useRef<number | null>(null)
  const lastUserActivityRef = useRef<number>(Date.now())
  const isUserActiveRef = useRef(true)
  const lastBlurTimeRef = useRef<number>(0)
  const blurStartTimeRef = useRef<number>(0)
  const isBlurCountingRef = useRef<boolean>(false)
  const lastTabSwitchTimeRef = useRef<number>(0)
  const lastFullscreenExitTimeRef = useRef<number>(0)
  
  // Grace periods and limits
  const SYSTEM_EVENT_GRACE_PERIOD = 10000
  const DISPLAY_OFF_GRACE_PERIOD = 30000
  const NETWORK_WARNING_LIMIT = 5
  const DISPLAY_OFF_LIMIT = 5
  const BLUR_GRACE_PERIOD = 3000
  const TAB_SWITCH_GRACE_PERIOD = 5000
  const BLUR_DURATION_THRESHOLD = 2000
  const INACTIVITY_THRESHOLD = 120000
  const NETWORK_RECONNECT_GRACE = 60000
  
  const getStorageKey = useCallback(() => {
    return `exam_security_${attemptIdRef.current || 'default'}`
  }, [])

  // ✅ Auto-save on violation
  const autoSaveAndSubmit = useCallback(async (reason: string) => {
    if (isSubmittingRef.current || examEndedRef.current) return
    if (!attemptIdRef.current) return
    
    isSubmittingRef.current = true
    
    try {
      console.log(`🔄 Auto-submitting exam: ${reason}`)
      
      if (onAutoSubmit) {
        await onAutoSubmit(reason)
        return
      }
      
      // Calculate score from answers
      let objectiveScore = 0
      let theoryScore = 0
      let correctCount = 0
      let incorrectCount = 0
      let unansweredCount = 0
      
      questions.forEach((q: any) => {
        const answer = answers[q.id] || ''
        const isTheory = q.type === 'theory'
        
        if (isTheory) {
          if (answer && answer.trim()) {
            theoryScore += q.marks || q.points || 10
          }
        } else {
          const maxScore = q.marks || q.points || 0.5
          const correctAnswer = String(q.correct_answer || '').trim()
          const studentAnswer = answer.trim()
          
          if (studentAnswer) {
            if (studentAnswer.toLowerCase() === correctAnswer.toLowerCase()) {
              objectiveScore += maxScore
              correctCount++
            } else {
              incorrectCount++
            }
          } else {
            unansweredCount++
          }
        }
      })
      
      const totalScore = objectiveScore + theoryScore
      const totalMax = questions.reduce((sum, q) => sum + (q.marks || q.points || (q.type === 'theory' ? 10 : 0.5)), 0)
      const percentage = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0
      
      // Separate objective and theory answers
      const objectiveAnswers: Record<string, string> = {}
      const theoryAnswers: Record<string, string> = {}
      
      questions.forEach((q: any) => {
        const answer = answers[q.id] || ''
        if (q.type === 'theory') {
          theoryAnswers[q.id] = answer
        } else {
          objectiveAnswers[q.id] = answer
        }
      })
      
      const { error } = await supabase
        .from('exam_attempts')
        .update({
          answers: objectiveAnswers,
          theory_answers: theoryAnswers,
          objective_score: objectiveScore,
          theory_score: theoryScore,
          total_score: totalScore,
          percentage: percentage,
          correct_count: correctCount,
          incorrect_count: incorrectCount,
          unanswered_count: unansweredCount,
          status: 'pending_theory',
          submitted_at: new Date().toISOString(),
          is_auto_submitted: true,
          auto_submit_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', attemptIdRef.current)
      
      if (error) {
        console.error('Auto-submit error:', error)
        try {
          const pending = JSON.parse(localStorage.getItem('pending_exam_submissions') || '[]')
          pending.push({
            attemptId: attemptIdRef.current,
            answers,
            reason,
            timestamp: Date.now()
          })
          localStorage.setItem('pending_exam_submissions', JSON.stringify(pending))
        } catch (e) {
          console.error('Failed to store pending submission:', e)
        }
      } else {
        console.log(`✅ Exam auto-submitted: ${reason}`)
        toast.info(`Exam auto-submitted: ${reason}`)
      }
    } catch (error) {
      console.error('Auto-submit error:', error)
    } finally {
      isSubmittingRef.current = false
      examEndedRef.current = true
    }
  }, [attemptIdRef, answers, questions, onAutoSubmit, examEndedRef])

  // Save security state
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

  // Restore state from sessionStorage
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
            autoSaveAndSubmit("Security limit reached before reload")
          }
        } else {
          sessionStorage.removeItem(getStorageKey())
        }
      }
    } catch (e) {
      console.error('Failed to restore security state:', e)
    }
  }, [getStorageKey, autoSaveAndSubmit])

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

  // Sync pending updates
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

  // ✅ UPDATED: triggerViolation with auto-save
  const triggerViolation = useCallback((reason: string) => {
    if (violationRef.current || examTerminated) return
    violationRef.current = true
    
    autoSaveAndSubmit(`Security violation: ${reason}`).then(() => {
      setSecurityViolated(true)
      setExamTerminated(true)
      saveSecurityState()
      
      toast.error(`SECURITY VIOLATION: ${reason} - Exam submitted automatically!`)
      setTimeout(() => onViolation(), 500)
    }).catch(() => {
      setSecurityViolated(true)
      setExamTerminated(true)
      toast.error(`SECURITY VIOLATION: ${reason} - Exam terminated!`)
      setTimeout(() => onViolation(), 300)
    })
  }, [onViolation, examTerminated, saveSecurityState, autoSaveAndSubmit])

  const handleViolation = useCallback((reason: string) => {
    triggerViolation(reason)
  }, [triggerViolation])

  // --- System Sleep Detection ---
  useEffect(() => {
    if (!examStarted || examEndedRef.current || examTerminated) return

    const handleVisibilityChange = () => {
      const now = Date.now()
      const timeSinceLastChange = now - lastVisibilityChangeRef.current
      const timeSinceActivity = now - lastUserActivityRef.current
      
      if (document.hidden) {
        lastVisibilityChangeRef.current = now
        displayOffStartTimeRef.current = now
        
        if (timeSinceActivity > INACTIVITY_THRESHOLD) {
          if (visibilityTimeoutRef.current) {
            clearTimeout(visibilityTimeoutRef.current)
          }
          
          visibilityTimeoutRef.current = setTimeout(() => {
            if (document.hidden && !examEndedRef.current && !examTerminated) {
              const stillInactive = Date.now() - lastUserActivityRef.current > INACTIVITY_THRESHOLD
              if (stillInactive) {
                isSystemSleepRef.current = true
                setIsSystemSleeping(true)
                toast.warning("System sleep detected - Resuming exam...")
                
                const sleepDuration = Date.now() - (displayOffStartTimeRef.current || now)
                if (sleepDuration > DISPLAY_OFF_GRACE_PERIOD) {
                  setDisplayOffCount(prev => {
                    const n = prev + 1
                    persistViolation('display', n)
                    if (n >= DISPLAY_OFF_LIMIT) {
                      handleViolation("Excessive system sleep/displays off detected")
                    }
                    return n
                  })
                }
              }
            }
          }, SYSTEM_EVENT_GRACE_PERIOD)
        } else {
          console.log('Quick tab switch detected, ignoring sleep detection')
        }
      } else {
        if (visibilityTimeoutRef.current) {
          clearTimeout(visibilityTimeoutRef.current)
          visibilityTimeoutRef.current = null
        }
        
        if (displayOffStartTimeRef.current) {
          const sleepDuration = now - displayOffStartTimeRef.current
          displayOffStartTimeRef.current = null
          
          if (isSystemSleepRef.current && sleepDuration > 5000) {
            isSystemSleepRef.current = false
            setIsSystemSleeping(false)
            toast.info(`Exam resumed after ${Math.round(sleepDuration/1000)}s of system sleep`)
          }
        }
        
        lastVisibilityChangeRef.current = now
        if (isSystemSleepRef.current) {
          isSystemSleepRef.current = false
          setIsSystemSleeping(false)
        }
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
      
      if (isSystemSleepRef.current) {
        isSystemSleepRef.current = false
        setIsSystemSleeping(false)
      }
    }

    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click', 'mousemove']
    activityEvents.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true })
    })

    const inactivityCheck = setInterval(() => {
      const now = Date.now()
      const timeSinceActivity = now - lastUserActivityRef.current
      
      if (timeSinceActivity > INACTIVITY_THRESHOLD && !document.hidden && !isSystemSleepRef.current) {
        toast.warning("You've been inactive for a while. Please interact with the exam.")
      }
    }, 60000)

    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleUserActivity)
      })
      clearInterval(inactivityCheck)
    }
  }, [examStarted, examTerminated, examEndedRef])

  // --- Screen Sleep/Wake Detection ---
  useEffect(() => {
    if (!examStarted || examEndedRef.current || examTerminated) return

    if ('getBattery' in navigator) {
      const getBattery = (navigator as Navigator & { getBattery?: () => Promise<BatteryManager> }).getBattery
      
      if (getBattery) {
        getBattery().then(() => {}).catch(() => {})
      }
    }

    const handleOrientationChange = () => {
      if (isSystemSleepRef.current) {
        isSystemSleepRef.current = false
        setIsSystemSleeping(false)
        toast.info("Screen resumed")
      }
    }

    const handleFocus = () => {
      if (isSystemSleepRef.current) {
        isSystemSleepRef.current = false
        setIsSystemSleeping(false)
        toast.info("Exam resumed after system sleep")
      }
      isBlurCountingRef.current = false
      blurStartTimeRef.current = 0
    }

    window.addEventListener('orientationchange', handleOrientationChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [examStarted, examTerminated, examEndedRef])

  // --- Network Status Monitoring ---
  useEffect(() => {
    if (!examStarted || examEndedRef.current || examTerminated) return

    let reconnectTimeout: NodeJS.Timeout | null = null

    const handleOnline = async () => {
      setIsOnline(true)
      toast.success("Network connection restored")
      
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
        reconnectTimeout = null
      }
      
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
        } else if (n >= NETWORK_WARNING_LIMIT) {
          if (reconnectTimeout) {
            clearTimeout(reconnectTimeout)
          }
          reconnectTimeout = setTimeout(() => {
            if (!navigator.onLine) {
              handleViolation("Extended network interruption detected")
            }
          }, NETWORK_RECONNECT_GRACE)
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
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }
      clearInterval(connectionCheck)
    }
  }, [examStarted, examTerminated, examEndedRef, syncPendingUpdates, persistViolation, handleViolation])

  // --- Page Reload Handling ---
  useEffect(() => {
    if (!examStarted || examEndedRef.current || examTerminated) return

    const handlePageLoad = () => {
      const now = Date.now()
      
      const resetTimeRef = { current: now }
      
      if (now - resetTimeRef.current > reloadWindowMs) {
        reloadCountRef.current = 0
        resetTimeRef.current = now
      }
      
      const isUserReload = performance?.navigation?.type === 1
      
      if (isUserReload) {
        reloadCountRef.current++
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
      lastBlurTimeRef.current = 0
      blurStartTimeRef.current = 0
      isBlurCountingRef.current = false
      lastTabSwitchTimeRef.current = 0
    }
  }, [examStarted])

  // --- Tab Switch Detection ---
  useEffect(() => {
    if (!examStarted || examEndedRef.current || examTerminated) return
    
    const h = () => {
      if (isSystemSleepRef.current) {
        console.log('Tab switch during system sleep - ignoring')
        return
      }
      
      if (document.hidden && !examEndedRef.current && !examTerminated) {
        const now = Date.now()
        if (now - lastTabSwitchTimeRef.current < TAB_SWITCH_GRACE_PERIOD) {
          console.log('Tab switch within grace period - ignoring')
          return
        }
        lastTabSwitchTimeRef.current = now
        
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

  // --- Fullscreen Detection ---
  useEffect(() => {
    if (!examStarted || examEndedRef.current || examTerminated) return
    
    const h = () => {
      const fs = !!(document.fullscreenElement || (document as any).webkitFullscreenElement)
      setFullscreen(fs)
      
      if (isSystemSleepRef.current) {
        console.log('Fullscreen exit during system sleep - ignoring')
        return
      }
      
      if (!fs && !examEndedRef.current && !examTerminated) {
        const now = Date.now()
        if (now - lastFullscreenExitTimeRef.current < 5000) {
          console.log('Fullscreen exit within grace period - ignoring')
          return
        }
        lastFullscreenExitTimeRef.current = now
        
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

  // --- Window Blur Detection ---
  useEffect(() => {
    if (!examStarted || examEndedRef.current || examTerminated) return
    
    const h = () => {
      if (examEndedRef.current || examTerminated) return
      if (isSystemSleepRef.current) {
        console.log('Window blur during system sleep - ignoring')
        return
      }
      
      const now = Date.now()
      
      if (now - lastBlurTimeRef.current < BLUR_GRACE_PERIOD) {
        console.log('Blur within grace period - ignoring')
        return
      }
      
      lastBlurTimeRef.current = now
      blurStartTimeRef.current = now
      isBlurCountingRef.current = true
      
      setTimeout(() => {
        if (document.hidden && isBlurCountingRef.current) {
          const blurDuration = Date.now() - blurStartTimeRef.current
          if (blurDuration > BLUR_DURATION_THRESHOLD) {
            blurCountRef.current++
            
            if (blurCountRef.current >= 3) {
              handleViolation("Window focus lost multiple times")
            } else if (blurCountRef.current === 1) {
              toast.warning("Window lost focus! Do not leave the exam")
            } else if (blurCountRef.current === 2) {
              toast.error("Final warning! Window focus lost again")
            }
          }
          isBlurCountingRef.current = false
        }
      }, BLUR_DURATION_THRESHOLD + 100)
    }
    
    window.addEventListener("blur", h)
    return () => {
      window.removeEventListener("blur", h)
      isBlurCountingRef.current = false
    }
  }, [examStarted, examTerminated, examEndedRef, handleViolation])

  // --- Keyboard Blocked ---
  useEffect(() => {
    if (!examStarted || examTerminated) return
    
    const keydown = (e: KeyboardEvent) => {
      if (isSystemSleepRef.current) return
      
      const essentialShortcuts = [
        e.altKey && e.key === 'd',
        e.altKey && e.key === 'Home',
        e.ctrlKey && e.key === 'o',
        e.ctrlKey && e.key === 's'
      ]
      
      if (essentialShortcuts.some(shortcut => shortcut)) return
      
      const blockedKeys = ['F5', 'F12', 'F11']
      const blockedCtrlKeys = ['c', 'v', 'x', 'p', 'a', 'r', 'w', 't', 'n', 'u', 'i']
      
      if (blockedKeys.includes(e.key)) {
        e.preventDefault()
        toast.warning("Refresh blocked during exam")
        return
      }
      
      if (e.ctrlKey && blockedCtrlKeys.includes(e.key.toLowerCase())) {
        e.preventDefault()
        toast.warning("Keyboard shortcut blocked")
        return
      }
      
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault()
        toast.warning("Alt+Tab blocked during exam")
        return
      }
    }
    
    document.addEventListener("keydown", keydown, true)
    return () => document.removeEventListener("keydown", keydown, true)
  }, [examStarted, examTerminated])

  // --- Context Menu Blocked ---
  useEffect(() => {
    if (!examStarted || examTerminated) return
    const prevent = (e: Event) => {
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