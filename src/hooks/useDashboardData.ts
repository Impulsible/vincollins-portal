// src/hooks/useDashboardData.ts
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

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

export function useDashboardData(profile: { id?: string; class?: string } | null) {
  const [loading, setLoading] = useState(true)
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

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!profile?.id) return
      
      setLoading(true)
      try {
        // Fetch available exams
        const { data: exams } = await supabase
          .from('exams')
          .select('*')
          .eq('status', 'published')
          .limit(10)

        // Fetch classmates
        const { data: classmates } = await supabase
          .from('profiles')
          .select('id, full_name, email, photo_url, class, department, first_name, last_name, display_name, vin_id')
          .eq('class', profile.class)
          .eq('role', 'student')
          .neq('id', profile.id)
          .limit(6)

        setStats(prev => ({
          ...prev,
          availableExams: exams || [],
          classmates: classmates || [],
          completedExams: 0,
          passedExams: 0,
          failedExams: 0
        }))

        setBannerStats(prev => ({
          ...prev,
          availableExams: exams?.length || 0,
          totalExams: exams?.length || 0
        }))

      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [profile?.id, profile?.class])

  return { stats, bannerStats, loading }
}