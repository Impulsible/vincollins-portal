// src/app/student/hooks/useDashboardData.ts
'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { StudentProfile } from '../types'

export interface ExamAttempt {
  id: string
  exam_id: string
  exam_title: string
  exam_subject: string
  status: string
  percentage: number
  is_passed: boolean
  total_score: number
  term: string
  session_year: string
}

export interface PerformanceStats {
  totalExams: number
  completedExams: number
  averageScore: number
  passedExams: number
  failedExams: number
  pendingResults: number
  recentAttempts: ExamAttempt[]
  availableExams: any[]
  recentAssignments: any[]
  recentNotes: any[]
  allAssignments: any[]
  allNotes: any[]
  classmates: any[]
}

export interface BannerStats {
  completedExams: number
  averageScore: number
  availableExams: number
  totalExams: number
  totalSubjects: number
  currentGrade: string
  gradeColor: string
  currentTerm: string
  sessionYear: string
}

export function useDashboardData(profile: StudentProfile | null) {
  const [loading, setLoading] = useState(true)
  const [termProgress, setTermProgress] = useState<any>(null)
  const [stats, setStats] = useState<PerformanceStats>({
    totalExams: 0,
    completedExams: 0,
    averageScore: 0,
    passedExams: 0,
    failedExams: 0,
    pendingResults: 0,
    recentAttempts: [],
    availableExams: [],
    recentAssignments: [],
    recentNotes: [],
    allAssignments: [],
    allNotes: [],
    classmates: []
  })

  const [bannerStats, setBannerStats] = useState<BannerStats>({
    completedExams: 0,
    averageScore: 0,
    availableExams: 0,
    totalExams: 0,
    totalSubjects: 17,
    currentGrade: 'N/A',
    gradeColor: 'text-gray-400',
    currentTerm: 'Third Term',
    sessionYear: '2025/2026'
  })

  const loadDashboardData = useCallback(async () => {
    if (!profile?.id) return
    
    setLoading(true)
    try {
      // ✅ FIX: Filter exams by student's class
      const studentClass = profile.class
      
      // Fetch available exams - ONLY for student's class
      const { data: exams, error: examsError } = await supabase
        .from('exams')
        .select('*')
        .eq('status', 'published')
        .eq('class', studentClass)  // ✅ Filter by student's class
        .order('created_at', { ascending: false })

      if (examsError) {
        console.error('Error fetching exams:', examsError)
      }

      // Also fetch exams that are marked for 'all' classes
      const { data: allClassExams, error: allClassError } = await supabase
        .from('exams')
        .select('*')
        .eq('status', 'published')
        .eq('class', 'all')
        .order('created_at', { ascending: false })

      if (allClassError) {
        console.error('Error fetching all-class exams:', allClassError)
      }

      // Combine both sets of exams
      const allAvailableExams = [...(exams || []), ...(allClassExams || [])]

      // Fetch classmates
      const { data: classmates } = await supabase
        .from('profiles')
        .select('id, full_name, email, photo_url, class, department, first_name, last_name, display_name, vin_id')
        .eq('class', studentClass)
        .eq('role', 'student')
        .neq('id', profile.id)
        .limit(6)

      // Fetch assignments for student's class
      const { data: assignments } = await supabase
        .from('assignments')
        .select('*')
        .eq('class', studentClass)
        .eq('status', 'published')
        .order('due_date', { ascending: true })
        .limit(5)

      // Fetch notes for student's class
      const { data: notes } = await supabase
        .from('notes')
        .select('*')
        .eq('class', studentClass)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(5)

      console.log('📊 Available exams for', studentClass, ':', allAvailableExams.length)
      console.log('📝 Exams list:', allAvailableExams)

      setStats(prev => ({
        ...prev,
        availableExams: allAvailableExams || [],
        classmates: classmates || [],
        recentAssignments: assignments || [],
        recentNotes: notes || [],
        totalExams: allAvailableExams?.length || 0
      }))

      setBannerStats(prev => ({
        ...prev,
        availableExams: allAvailableExams?.length || 0,
        totalExams: allAvailableExams?.length || 0
      }))

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [profile?.id, profile?.class])

  return { 
    loading, 
    stats, 
    bannerStats, 
    termProgress, 
    loadDashboardData,
    setStats,
    setBannerStats 
  }
}