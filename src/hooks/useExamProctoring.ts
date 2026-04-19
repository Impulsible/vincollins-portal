'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'

interface ProctoringData {
  face_detected: boolean
  multiple_faces: boolean
  suspicious_movement: boolean
  noise_level: number
  browser_focus: boolean
  fullscreen_active: boolean
  prohibited_apps: string[]
}

interface UseExamProctoringProps {
  examId: string
  studentId: string
  enabled: boolean
  faceDetectionRequired?: boolean
  fullscreenRequired?: boolean
  tabSwitchLimit?: number
  onViolation?: (type: string, message: string) => void
  onTerminate?: () => void
}

export function useExamProctoring({
  examId,
  studentId,
  enabled = true,
  faceDetectionRequired = false,
  fullscreenRequired = true,
  tabSwitchLimit = 2,
  onViolation,
  onTerminate
}: UseExamProctoringProps) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [proctoringData, setProctoringData] = useState<ProctoringData>({
    face_detected: true,
    multiple_faces: false,
    suspicious_movement: false,
    noise_level: 0,
    browser_focus: true,
    fullscreen_active: false,
    prohibited_apps: []
  })
  
  const [tabSwitches, setTabSwitches] = useState(0)
  const [violations, setViolations] = useState<any[]>([])
  const [warnings, setWarnings] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const sessionRef = useRef(sessionId)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize session
  useEffect(() => {
    if (!enabled || !examId || !studentId) return

    const initSession = async () => {
      try {
        const response = await fetch('/api/exam/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exam_id: examId,
            student_id: studentId,
            action: 'start',
            ip_address: await getIPAddress(),
            device_info: navigator.userAgent
          })
        })

        const data = await response.json()
        if (data.session) {
          setSessionId(data.session.id)
          sessionRef.current = data.session.id
          setViolations(data.session.violations || [])
          setWarnings(data.session.warnings || 0)
          setTabSwitches(data.session.tab_switches || 0)
        }
      } catch (error) {
        console.error('Failed to initialize session:', error)
      }
    }

    initSession()

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [enabled, examId, studentId])

  // Get IP address
  const getIPAddress = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip
    } catch {
      return 'unknown'
    }
  }

  // Tab visibility tracking
  useEffect(() => {
    if (!enabled) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitches(prev => {
          const newCount = prev + 1
          
          // Report tab switch
          reportProctoringEvent({
            tab_switches: newCount
          })
          
          // Check limit
          if (newCount > tabSwitchLimit) {
            const message = `Tab switch limit exceeded (${newCount}/${tabSwitchLimit})`
            toast.warning(message)
            onViolation?.('tab_switch', message)
            
            if (newCount >= tabSwitchLimit + 3) {
              toast.error('Exam terminated due to excessive tab switching')
              onTerminate?.()
            }
          } else {
            toast.warning(`Warning: Do not switch tabs during exam (${newCount}/${tabSwitchLimit})`)
          }
          
          return newCount
        })
        
        setProctoringData(prev => ({ ...prev, browser_focus: false }))
      } else {
        setProctoringData(prev => ({ ...prev, browser_focus: true }))
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [enabled, tabSwitchLimit, onViolation, onTerminate])

  // Fullscreen tracking
  useEffect(() => {
    if (!enabled || !fullscreenRequired) return

    const handleFullscreenChange = () => {
      const isFullscreenNow = !!document.fullscreenElement
      setIsFullscreen(isFullscreenNow)
      
      setProctoringData(prev => ({ ...prev, fullscreen_active: isFullscreenNow }))
      
      if (!isFullscreenNow) {
        toast.warning('Please stay in fullscreen mode')
        onViolation?.('fullscreen', 'Exited fullscreen mode')
        
        // Try to re-enter fullscreen
        setTimeout(() => {
          document.documentElement.requestFullscreen?.()
        }, 500)
      }
      
      reportProctoringEvent({
        proctoring_data: { fullscreen_active: isFullscreenNow }
      })
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    
    // Request fullscreen on start
    if (fullscreenRequired) {
      document.documentElement.requestFullscreen?.()
    }

    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [enabled, fullscreenRequired, onViolation])

  // Report proctoring events to server
  const reportProctoringEvent = useCallback(async (data: any) => {
    if (!sessionRef.current) return

    try {
      await fetch('/api/exam/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exam_id: examId,
          student_id: studentId,
          ...data
        })
      })
    } catch (error) {
      console.error('Failed to report event:', error)
    }
  }, [examId, studentId])

  // Periodic proctoring data sync
  useEffect(() => {
    if (!enabled || !sessionId) return

    intervalRef.current = setInterval(() => {
      reportProctoringEvent({
        proctoring_data: proctoringData
      })
    }, 5000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [enabled, sessionId, proctoringData, reportProctoringEvent])

  // Keyboard shortcut prevention
  useEffect(() => {
    if (!enabled) return

    const preventShortcuts = (e: KeyboardEvent) => {
      // Prevent Alt+Tab, Alt+F4, Ctrl+W, Ctrl+T, Ctrl+N, F11, Escape
      const blockedKeys = [
        { key: 'Tab', alt: true },
        { key: 'F4', alt: true },
        { key: 'w', ctrl: true },
        { key: 't', ctrl: true },
        { key: 'n', ctrl: true },
        { key: 'F11' },
        { key: 'Escape' }
      ]

      const isBlocked = blockedKeys.some(combo => {
        if (combo.key === e.key) {
          if (combo.alt !== undefined && combo.alt !== e.altKey) return false
          if (combo.ctrl !== undefined && combo.ctrl !== e.ctrlKey) return false
          return true
        }
        return false
      })

      if (isBlocked) {
        e.preventDefault()
        toast.warning('This shortcut is disabled during exam')
      }
    }

    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault()
    }

    const preventCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault()
      toast.warning('Copy/paste is disabled during exam')
    }

    document.addEventListener('keydown', preventShortcuts)
    document.addEventListener('contextmenu', preventContextMenu)
    document.addEventListener('copy', preventCopyPaste)
    document.addEventListener('paste', preventCopyPaste)
    document.addEventListener('cut', preventCopyPaste)

    return () => {
      document.removeEventListener('keydown', preventShortcuts)
      document.removeEventListener('contextmenu', preventContextMenu)
      document.removeEventListener('copy', preventCopyPaste)
      document.removeEventListener('paste', preventCopyPaste)
      document.removeEventListener('cut', preventCopyPaste)
    }
  }, [enabled])

  // End session
  const endSession = useCallback(async (status: string = 'completed', score?: number, percentage?: number) => {
    if (!sessionRef.current) return

    try {
      await fetch('/api/exam/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionRef.current,
          status,
          score,
          percentage_score: percentage
        })
      })
    } catch (error) {
      console.error('Failed to end session:', error)
    }
  }, [])

  return {
    sessionId,
    proctoringData,
    tabSwitches,
    violations,
    warnings,
    isFullscreen,
    videoRef,
    streamRef,
    endSession,
    reportProctoringEvent
  }
}