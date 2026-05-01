"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { AUTO_SAVE_INTERVAL } from "../constants"

export function useAutoSave(aid: string|null, started: boolean, answers: Record<string,string>, questions: any[], endedRef: React.MutableRefObject<boolean>) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<Date|null>(null)
  const ref = useRef<NodeJS.Timeout|null>(null)
  const doSave = useCallback(async () => {
    if (!aid || !started || endedRef.current || Object.keys(answers).length === 0) return
    setSaving(true)
    try {
      const ta: Record<string,string> = {}
      for (const q of questions) { if (q.type === "theory") ta[q.id] = answers[q.id] || "" }
      const { error } = await supabase.from("exam_attempts").update({ 
        answers, 
        theory_answers: ta, 
        last_auto_save: new Date().toISOString() 
      }).eq("id", aid)
      if (error) {
        console.error("Auto-save error:", error.message)
      } else {
        setSaved(new Date())
      }
    } catch(e) { 
      // Silent fail - auto-save errors shouldn't disrupt the exam
    }
    finally { setSaving(false) }
  }, [aid, started, answers, questions, endedRef])
  useEffect(() => { if (!started || endedRef.current) return; ref.current = setInterval(doSave, AUTO_SAVE_INTERVAL); return () => { if(ref.current) clearInterval(ref.current) } }, [started, doSave, endedRef])
  useEffect(() => { if (!started || endedRef.current) return; const t = setTimeout(doSave, 2000); return () => clearTimeout(t) }, [answers, started, doSave, endedRef])
  return { autoSaving: saving, lastSaved: saved }
}