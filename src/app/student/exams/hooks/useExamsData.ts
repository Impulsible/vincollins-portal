"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import type { Exam, StudentProfile, ExamAttempt, TermOption, TermSession, StatsState } from "../types"
import { getSubjectCountForClass, calculateGrade, getCurrentTermSession, getTermLabel, normalizeClassName } from "../utils"
import { TERM_NAMES } from "../constants"

export function useExamsData(router: ReturnType<typeof useRouter>) {
  const [loading, setLoading] = useState(true)
  const [exams, setExams] = useState<Exam[]>([])
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [examAttempts, setExamAttempts] = useState<Record<string, ExamAttempt>>({})
  const [availableTerms, setAvailableTerms] = useState<TermOption[]>([])
  const [selectedTermSession, setSelectedTermSession] = useState<TermSession | null>(null)
  const [stats, setStats] = useState<StatsState>({
    available: 0, completed: 0, upcoming: 0, averageScore: 0,
    currentGrade: "N/A", gradeColor: "text-gray-400",
    totalSubjects: 17, termName: "Third Term", sessionYear: "2025/2026"
  })
  
  const hasLoaded = useRef(false)

  const loadData = useCallback(async (term?: string, session?: string) => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/portal"); return }

      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()
      if (!profileData) { toast.error("Profile not found"); setLoading(false); return }
      if (profileData.role !== "student") { router.push("/portal"); return }

      const totalSubjects = profileData.subject_count || getSubjectCountForClass(profileData.class || "")
      const sp: StudentProfile = {
        id: profileData.id,
        full_name: profileData.full_name || user.email?.split("@")[0] || "Student",
        email: profileData.email,
        class: profileData.class || "Not Assigned",
        department: profileData.department || "General",
        photo_url: profileData.photo_url,
        subject_count: totalSubjects
      }
      setProfile(sp)

      // Load available terms on first load only
      if (!hasLoaded.current) {
        hasLoaded.current = true
        try {
          const termsMap = new Map<string, TermOption>()
          const { data: progressData } = await supabase.from("student_term_progress").select("term, session_year").eq("student_id", sp.id)
          if (progressData) {
            progressData.forEach((p: any) => {
              if (p.term && p.session_year) {
                const key = p.term + "|" + p.session_year
                if (!termsMap.has(key)) termsMap.set(key, { term: p.term, session_year: p.session_year, label: getTermLabel(p.term, p.session_year) })
              }
            })
          }
          const { data: examTerms } = await supabase.from("exams").select("term, session_year").eq("status", "published")
          if (examTerms) {
            examTerms.forEach((t: any) => {
              if (t.term && t.session_year) {
                const key = t.term + "|" + t.session_year
                if (!termsMap.has(key)) termsMap.set(key, { term: t.term, session_year: t.session_year, label: getTermLabel(t.term, t.session_year) })
              }
            })
          }
          const terms = Array.from(termsMap.values())
          terms.sort((a, b) => b.session_year.localeCompare(a.session_year) || (a.term === "third" ? -1 : a.term === "second" ? 0 : 1) - (b.term === "third" ? -1 : b.term === "second" ? 0 : 1))
          setAvailableTerms(terms)
        } catch (e) { console.error(e) }
      }

      const targetTerm = term || "third"
      const targetSession = session || "2025/2026"

      const { data: examsData } = await supabase.from("exams").select("*").eq("status", "published").eq("term", targetTerm).eq("session_year", targetSession).order("created_at", { ascending: false })
      const nsc = normalizeClassName(sp.class)
      const filtered = (examsData || []).filter((exam: any) => !exam.class || normalizeClassName(exam.class) === nsc)
      setExams(filtered)

      const { data: attemptsData } = await supabase.from("exam_attempts").select("*").eq("student_id", sp.id).eq("term", targetTerm).eq("session_year", targetSession)
      const am: Record<string, ExamAttempt> = {}
      attemptsData?.forEach((a: any) => {
        am[a.exam_id] = { id: a.id, exam_id: a.exam_id, status: a.status, percentage: a.percentage, total_score: a.total_score }
      })
      setExamAttempts(am)

      const completedCount = Object.values(am).filter(a => a.status === "completed").length
      const avgScore = completedCount > 0 ? Math.round(Object.values(am).filter(a => a.status === "completed").reduce((s, a) => s + (a.percentage || 0), 0) / completedCount) : 0
      const gi = calculateGrade(avgScore)

      setStats({
        available: filtered.filter((e: Exam) => !am[e.id] || am[e.id].status !== "completed").length,
        completed: completedCount,
        upcoming: filtered.filter((e: Exam) => e.starts_at && new Date(e.starts_at) > new Date()).length,
        averageScore: avgScore,
        currentGrade: completedCount > 0 ? gi.grade : "N/A",
        gradeColor: completedCount > 0 ? gi.color : "text-gray-400",
        totalSubjects,
        termName: TERM_NAMES[targetTerm] || targetTerm,
        sessionYear: targetSession
      })
    } catch (e) {
      console.error("Error:", e)
      toast.error("Failed to load exams")
    } finally {
      setLoading(false)
    }
  }, [router])

  // Load data once on mount
  useEffect(() => {
    loadData()
  }, [loadData])

  const handleTermSessionChange = async (value: string) => {
    const [term, session] = value.split("|")
    setSelectedTermSession({ term, session_year: session })
    await loadData(term, session)
  }

  return {
    loading, exams, profile, examAttempts,
    availableTerms, selectedTermSession, stats,
    loadData, handleTermSessionChange,
  }
}
