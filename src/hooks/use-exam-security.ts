'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'

interface SecurityConfig {
  // Tab switch detection
  maxTabSwitches?: number
  tabSwitchAction?: 'warn' | 'auto-submit'
  
  // Timer lock
  autoSubmitOnTimeEnd?: boolean
  warningThresholds?: number[] // seconds remaining for warnings
  
  // One attempt only
  preventMultipleAttempts?: boolean
  
  // Randomization
  shuffleQuestions?: boolean
  shuffleOptions?: boolean
  
  // Fullscreen mode
  enforceFullscreen?: boolean
  
  // Copy-paste prevention
  preventCopyPaste?: boolean
  
  // Right-click prevention
  preventRightClick?: boolean
  
  // Print prevention
  preventPrint?: boolean
}

interface SecurityState {
  tabSwitches: number
  isFullscreen: boolean
  isPaused: boolean
  timeRemaining: number
  warnings: string[]
}

interface Question {
  id: string
  text: string
  options?: string[]
  correctAnswer?: string | string[]
  type: 'single' | 'multiple' | 'text'
  points: number
}

interface Answer {
  student_answer: string | string[] | null
  correct_answer: string | string[]
  is_correct: boolean
  points_awarded: number
  max_points: number
}

// Declare BeforePrintEvent for TypeScript
declare global {
  interface WindowEventMap {
    beforeprint: Event;
    afterprint: Event;
  }
}

export function useExamSecurity(
  examId: string,
  userId: string,
  duration: number,
  config: SecurityConfig = {},
  onAutoSubmit?: () => void
) {
  const [state, setState] = useState<SecurityState>({
    tabSwitches: 0,
    isFullscreen: false,
    isPaused: false,
    timeRemaining: duration * 60,
    warnings: [],
  })

  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [attemptCount, setAttemptCount] = useState(0)
  const startTimeRef = useRef<number>(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const hasSubmittedRef = useRef(false)

  const defaultConfig: SecurityConfig = {
    maxTabSwitches: 3,
    tabSwitchAction: 'auto-submit',
    autoSubmitOnTimeEnd: true,
    warningThresholds: [300, 60], // 5 min, 1 min
    preventMultipleAttempts: true,
    shuffleQuestions: true,
    shuffleOptions: true,
    enforceFullscreen: true,
    preventCopyPaste: true,
    preventRightClick: true,
    preventPrint: true,
    ...config,
  }

  // Initialize startTime
  useEffect(() => {
    startTimeRef.current = Date.now()
  }, [])

  // ==================== Randomization Functions ====================
  const shuffleArray = useCallback(<T,>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }, [])

  const shuffleQuestionsAndOptions = useCallback((originalQuestions: Question[]) => {
    let processedQuestions = [...originalQuestions]
    
    // Shuffle questions if enabled
    if (defaultConfig.shuffleQuestions) {
      processedQuestions = shuffleArray(processedQuestions)
    }
    
    // Shuffle options for each question if enabled
    if (defaultConfig.shuffleOptions) {
      processedQuestions = processedQuestions.map(q => ({
        ...q,
        options: q.options ? shuffleArray(q.options) : q.options,
      }))
    }
    
    return processedQuestions
  }, [shuffleArray, defaultConfig.shuffleQuestions, defaultConfig.shuffleOptions])

  // ==================== Timer Management ====================
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    
    timerRef.current = setInterval(() => {
      setState(prev => {
        const newTime = prev.timeRemaining - 1
        
        // Check warning thresholds
        if (defaultConfig.warningThresholds?.includes(newTime)) {
          const minutes = Math.floor(newTime / 60)
          toast(`${minutes} minute${minutes > 1 ? 's' : ''} remaining!`, {
            icon: '⏰',
            duration: 5000,
          })
        }
        
        // Auto-submit when time ends
        if (newTime <= 0 && defaultConfig.autoSubmitOnTimeEnd && !hasSubmittedRef.current) {
          if (timerRef.current) clearInterval(timerRef.current)
          toast.error('Time is up! Submitting your exam...')
          onAutoSubmit?.()
          hasSubmittedRef.current = true
          return { ...prev, timeRemaining: 0 }
        }
        
        return { ...prev, timeRemaining: Math.max(0, newTime) }
      })
    }, 1000)
  }, [onAutoSubmit, defaultConfig.autoSubmitOnTimeEnd, defaultConfig.warningThresholds])

  const pauseTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setState(prev => ({ ...prev, isPaused: true }))
  }, [])

  const resumeTimer = useCallback(() => {
    setState(prev => ({ ...prev, isPaused: false }))
    startTimer()
  }, [startTimer])

  // ==================== Tab Switch Detection ====================
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !hasSubmittedRef.current && !state.isPaused) {
        setState(prev => {
          const newTabSwitches = prev.tabSwitches + 1
          
          // Show warning
          const warningsRemaining = (defaultConfig.maxTabSwitches || 3) - newTabSwitches
          toast.error(
            `Tab switching detected! ${warningsRemaining} warning${warningsRemaining !== 1 ? 's' : ''} remaining.`,
            { duration: 5000 }
          )
          
          // Auto-submit if max exceeded
          if (newTabSwitches >= (defaultConfig.maxTabSwitches || 3) && defaultConfig.tabSwitchAction === 'auto-submit') {
            toast.error('Exam auto-submitted due to repeated tab switching!')
            onAutoSubmit?.()
            hasSubmittedRef.current = true
          }
          
          return { ...prev, tabSwitches: newTabSwitches }
        })
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [state.isPaused, onAutoSubmit, defaultConfig.maxTabSwitches, defaultConfig.tabSwitchAction])

  // ==================== Fullscreen Enforcement ====================
  const enterFullscreen = useCallback(async () => {
    if (!defaultConfig.enforceFullscreen) return
    
    try {
      const element = document.documentElement
      await element.requestFullscreen()
      setState(prev => ({ ...prev, isFullscreen: true }))
    } catch (err) {
      console.warn('Fullscreen request failed:', err)
    }
  }, [defaultConfig.enforceFullscreen])

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen()
      setState(prev => ({ ...prev, isFullscreen: false }))
    }
  }, [])

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && defaultConfig.enforceFullscreen && !hasSubmittedRef.current) {
        toast.error('Please stay in fullscreen mode for exam integrity')
        enterFullscreen()
      }
    }
    
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [defaultConfig.enforceFullscreen, enterFullscreen])

  // ==================== Copy-Paste Prevention ====================
  useEffect(() => {
    if (!defaultConfig.preventCopyPaste) return
    
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault()
      toast.error('Copying is disabled during exam', { duration: 2000 })
    }
    
    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault()
      toast.error('Pasting is disabled during exam', { duration: 2000 })
    }
    
    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault()
      toast.error('Cutting is disabled during exam', { duration: 2000 })
    }
    
    document.addEventListener('copy', handleCopy)
    document.addEventListener('paste', handlePaste)
    document.addEventListener('cut', handleCut)
    
    return () => {
      document.removeEventListener('copy', handleCopy)
      document.removeEventListener('paste', handlePaste)
      document.removeEventListener('cut', handleCut)
    }
  }, [defaultConfig.preventCopyPaste])

  // ==================== Right-Click Prevention ====================
  useEffect(() => {
    if (!defaultConfig.preventRightClick) return
    
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      toast.error('Right-click is disabled during exam', { duration: 2000 })
    }
    
    document.addEventListener('contextmenu', handleContextMenu)
    return () => document.removeEventListener('contextmenu', handleContextMenu)
  }, [defaultConfig.preventRightClick])

  // ==================== Print Prevention ====================
  useEffect(() => {
    if (!defaultConfig.preventPrint) return
    
    const handleBeforePrint = (e: Event) => {
      e.preventDefault()
      toast.error('Printing is disabled during exam', { duration: 2000 })
    }
    
    window.addEventListener('beforeprint', handleBeforePrint)
    return () => window.removeEventListener('beforeprint', handleBeforePrint)
  }, [defaultConfig.preventPrint])

  // ==================== One Attempt Only ====================
  useEffect(() => {
    if (!defaultConfig.preventMultipleAttempts) return
    
    const checkAttempt = async () => {
      try {
        // Check if user has already taken this exam
        const response = await fetch(`/api/exams/${examId}/attempts/${userId}`)
        const data = await response.json()
        
        if (data.hasAttempted) {
          toast.error('You have already taken this exam. Multiple attempts are not allowed.')
          setAttemptCount(1)
          // Redirect or disable exam start
        }
      } catch (err) {
        console.error('Failed to check attempts:', err)
      }
    }
    
    checkAttempt()
  }, [examId, userId, defaultConfig.preventMultipleAttempts])

  // ==================== Keyboard Shortcuts Prevention ====================
  useEffect(() => {
    const preventShortcuts = (e: KeyboardEvent) => {
      // Prevent F12 (DevTools)
      if (e.key === 'F12') {
        e.preventDefault()
        toast.error('Developer tools are disabled during exam')
      }
      
      // Prevent Ctrl+Shift+I (DevTools)
      if ((e.ctrlKey && e.shiftKey && e.key === 'I') || 
          (e.ctrlKey && e.key === 'u') ||
          (e.ctrlKey && e.key === 'U')) {
        e.preventDefault()
        toast.error('View source is disabled during exam')
      }
      
      // Prevent Ctrl+R (Refresh)
      if (e.ctrlKey && e.key === 'r') {
        e.preventDefault()
        toast.error('Refresh is disabled during exam')
      }
      
      // Prevent Ctrl+C / Ctrl+V
      if ((e.ctrlKey && e.key === 'c') || (e.ctrlKey && e.key === 'v')) {
        e.preventDefault()
      }
      
      // Prevent Alt+Tab detection (can't fully prevent, but can warn)
      if (e.altKey && e.key === 'Tab') {
        toast.error('Alt+Tab detected. Please stay focused on the exam.')
      }
    }
    
    document.addEventListener('keydown', preventShortcuts)
    return () => document.removeEventListener('keydown', preventShortcuts)
  }, [])

  return {
    // State
    ...state,
    answers,
    questions,
    attemptCount,
    hasAttempted: attemptCount > 0,
    
    // Methods
    shuffleQuestionsAndOptions,
    setAnswers,
    setQuestions,
    startTimer,
    pauseTimer,
    resumeTimer,
    enterFullscreen,
    exitFullscreen,
    
    // Security status
    isSecure: !state.isPaused && state.timeRemaining > 0 && state.tabSwitches < (defaultConfig.maxTabSwitches || 3),
  }
}