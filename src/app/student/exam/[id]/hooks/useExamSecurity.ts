"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { TAB_SWITCH_LIMIT, FULLSCREEN_EXIT_LIMIT } from "../constants"

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
  const violationRef = useRef(false)
  const blurCountRef = useRef(0)
  const attemptIdRef = useRef(attemptId)

  useEffect(() => { attemptIdRef.current = attemptId }, [attemptId])

  const persistViolation = async (type: 'tab' | 'fullscreen', count: number) => {
    if (!attemptIdRef.current) return
    try {
      await supabase.from('exam_attempts').update(
        type === 'tab' ? { tab_switches: count } : { fullscreen_exits: count }
      ).eq('id', attemptIdRef.current)
    } catch (e) {}
  }

  const triggerViolation = useCallback((reason: string) => {
    if (violationRef.current || examTerminated) return
    violationRef.current = true
    setSecurityViolated(true)
    setExamTerminated(true)
    toast.error("SECURITY VIOLATION: " + reason + " - Exam terminated!")
    setTimeout(() => onViolation(), 300)
  }, [onViolation, examTerminated])

  useEffect(() => {
    if (examStarted) {
      violationRef.current = false
      setExamTerminated(false)
      blurCountRef.current = 0
    }
  }, [examStarted])

  // Tab switch detection + persist
  useEffect(() => {
    if (!examStarted || examEndedRef.current || examTerminated) return
    const h = () => {
      if (document.hidden && !examEndedRef.current && !examTerminated) {
        setTabSwitches(prev => {
          const n = prev + 1
          persistViolation('tab', n)
          if (n === 1) toast.warning("Tab switch! (" + n + "/" + TAB_SWITCH_LIMIT + ")")
          else if (n === 2) toast.error("Final warning! (" + n + "/" + TAB_SWITCH_LIMIT + ")")
          else if (n >= TAB_SWITCH_LIMIT) triggerViolation("Tab switch limit exceeded")
          return n
        })
      }
    }
    document.addEventListener("visibilitychange", h)
    return () => document.removeEventListener("visibilitychange", h)
  }, [examStarted, examTerminated, triggerViolation, examEndedRef])

  // Fullscreen detection + persist
  useEffect(() => {
    if (!examStarted || examEndedRef.current || examTerminated) return
    const h = () => {
      const fs = !!(document.fullscreenElement || (document as any).webkitFullscreenElement)
      setFullscreen(fs)
      if (!fs && !examEndedRef.current && !examTerminated) {
        setFullscreenExits(prev => {
          const n = prev + 1
          persistViolation('fullscreen', n)
          if (n === 1) { toast.warning("Fullscreen exit! (" + n + "/" + FULLSCREEN_EXIT_LIMIT + ")"); setShowFullscreenPrompt(true) }
          else if (n === 2) { toast.error("Final warning! (" + n + "/" + FULLSCREEN_EXIT_LIMIT + ")"); setShowFullscreenPrompt(true) }
          else if (n >= FULLSCREEN_EXIT_LIMIT) triggerViolation("Fullscreen exit limit exceeded")
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
  }, [examStarted, examTerminated, triggerViolation, examEndedRef])

  // Window blur
  useEffect(() => {
    if (!examStarted || examEndedRef.current || examTerminated) return
    const h = () => {
      if (examEndedRef.current || examTerminated) return
      blurCountRef.current++
      if (blurCountRef.current >= 2) triggerViolation("Window focus lost multiple times")
      else if (blurCountRef.current === 1) toast.warning("Window lost focus! Do not leave the exam")
    }
    window.addEventListener("blur", h)
    return () => window.removeEventListener("blur", h)
  }, [examStarted, examTerminated, triggerViolation, examEndedRef])

  // BeforeUnload - just warn
  useEffect(() => {
    if (!examStarted || examEndedRef.current || examTerminated) return
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = "You have an exam in progress!"
    }
    window.addEventListener("beforeunload", h)
    return () => window.removeEventListener("beforeunload", h)
  }, [examStarted, examTerminated, examEndedRef])

  // Keyboard blocked
  useEffect(() => {
    if (!examStarted || examTerminated) return
    const keydown = (e: KeyboardEvent) => {
      if (e.ctrlKey && ["c","v","x","p","a","s","r","w","t","n"].includes(e.key.toLowerCase())) e.preventDefault()
      if (e.key === "F5" || e.key === "F12" || (e.ctrlKey && e.key === "F5")) e.preventDefault()
      if (e.altKey) e.preventDefault()
    }
    document.addEventListener("keydown", keydown, true)
    return () => document.removeEventListener("keydown", keydown, true)
  }, [examStarted, examTerminated])

  // Context menu blocked
  useEffect(() => {
    if (!examStarted || examTerminated) return
    const prevent = (e: Event) => e.preventDefault()
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
    } catch (e) {}
  }, [])

  return {
    tabSwitches, fullscreenExits, fullscreen, setFullscreen,
    showFullscreenPrompt, setShowFullscreenPrompt,
    securityViolated, examTerminated, enterFullscreen,
  }
}