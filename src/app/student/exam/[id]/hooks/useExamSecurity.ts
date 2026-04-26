"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { toast } from "sonner"
import { TAB_SWITCH_LIMIT, FULLSCREEN_EXIT_LIMIT } from "../constants"

export function useExamSecurity(
  examStarted: boolean,
  examEndedRef: React.MutableRefObject<boolean>,
  onViolation: () => void
) {
  const [tabSwitches, setTabSwitches] = useState(0)
  const [fullscreenExits, setFullscreenExits] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(false)
  const [securityViolated, setSecurityViolated] = useState(false)
  const [examTerminated, setExamTerminated] = useState(false)
  const violationRef = useRef(false)

  // Trigger violation only once
  const triggerViolation = useCallback((reason: string) => {
    if (violationRef.current || examTerminated) return
    violationRef.current = true
    setSecurityViolated(true)
    setExamTerminated(true)
    toast.error("SECURITY VIOLATION: " + reason + " - Exam terminated!")
    setTimeout(() => onViolation(), 300)
  }, [onViolation, examTerminated])

  // Reset when exam starts
  useEffect(() => {
    if (examStarted) {
      violationRef.current = false
      setExamTerminated(false)
    }
  }, [examStarted])

  // Tab switch detection
  useEffect(() => {
    if (!examStarted || examEndedRef.current || examTerminated) return

    const handleVisibilityChange = () => {
      if (document.hidden && !examEndedRef.current && !examTerminated) {
        setTabSwitches(prev => {
          const n = prev + 1
          if (n === 1) toast.warning("⚠️ Tab switch detected! (" + n + "/" + TAB_SWITCH_LIMIT + ")")
          else if (n === 2) toast.error("🚨 FINAL WARNING! (" + n + "/" + TAB_SWITCH_LIMIT + ")")
          else if (n >= TAB_SWITCH_LIMIT) triggerViolation("Tab switch limit exceeded")
          return n
        })
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [examStarted, examTerminated, triggerViolation, examEndedRef])

  // Fullscreen detection
  useEffect(() => {
    if (!examStarted || examEndedRef.current || examTerminated) return

    const handleFullscreenChange = () => {
      const fs = !!(document.fullscreenElement || (document as any).webkitFullscreenElement)
      setFullscreen(fs)
      if (!fs && !examEndedRef.current && !examTerminated) {
        setFullscreenExits(prev => {
          const n = prev + 1
          if (n === 1) { toast.warning("⚠️ Fullscreen exited! (" + n + "/" + FULLSCREEN_EXIT_LIMIT + ")"); setShowFullscreenPrompt(true) }
          else if (n === 2) { toast.error("🚨 FINAL WARNING! (" + n + "/" + FULLSCREEN_EXIT_LIMIT + ")"); setShowFullscreenPrompt(true) }
          else if (n >= FULLSCREEN_EXIT_LIMIT) triggerViolation("Fullscreen exit limit exceeded")
          return n
        })
      }
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange)
    }
  }, [examStarted, examTerminated, triggerViolation, examEndedRef])

  // Window blur (minimize/alt+tab)
  useEffect(() => {
    if (!examStarted || examEndedRef.current || examTerminated) return
    let blurCount = 0

    const handleBlur = () => {
      if (examEndedRef.current || examTerminated) return
      blurCount++
      if (blurCount >= 2) triggerViolation("Window focus lost multiple times")
      else if (blurCount === 1) toast.warning("⚠️ Window lost focus! Do not leave the exam")
    }

    window.addEventListener("blur", handleBlur)
    return () => window.removeEventListener("blur", handleBlur)
  }, [examStarted, examTerminated, triggerViolation, examEndedRef])

  // Back/Forward/Refresh detection
  useEffect(() => {
    if (!examStarted || examEndedRef.current || examTerminated) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!examTerminated) {
        triggerViolation("Attempted to leave exam page")
      }
      e.preventDefault()
      e.returnValue = ""
    }

    const handlePopState = () => {
      if (!examTerminated) {
        triggerViolation("Browser back/forward navigation detected")
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      window.removeEventListener("popstate", handlePopState)
    }
  }, [examStarted, examTerminated, triggerViolation, examEndedRef])

  // Keyboard shortcuts blocked
  useEffect(() => {
    if (!examStarted || examTerminated) return

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.ctrlKey && ["c","v","x","p","a","s","r","w","t","n","h","j","q"].includes(e.key.toLowerCase())) {
        e.preventDefault()
      }
      if (e.key === "F5" || e.key === "F12" || (e.ctrlKey && e.key === "F5")) {
        e.preventDefault()
        triggerViolation("Refresh/F12 attempt detected")
      }
      if (e.altKey) e.preventDefault()
      if (e.key === "Escape") e.preventDefault()
    }

    document.addEventListener("keydown", handleKeydown, true)
    return () => document.removeEventListener("keydown", handleKeydown, true)
  }, [examStarted, examTerminated, triggerViolation])

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
    tabSwitches,
    fullscreenExits,
    fullscreen,
    setFullscreen,
    showFullscreenPrompt,
    setShowFullscreenPrompt,
    securityViolated,
    examTerminated,
    enterFullscreen,
  }
}