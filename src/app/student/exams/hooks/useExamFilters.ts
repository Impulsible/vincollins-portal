// src/app/student/exams/hooks/useExamFilters.ts - FIXED VERSION

'use client'

import { useState, useMemo, useCallback } from 'react'
import type { Exam, ExamAttempt, SubjectConfig, TabType, ViewMode, ExamStatus } from '../types'
import { getSubjectConfig } from '../utils'

export function useExamFilters(
  exams: Exam[] = [],
  examAttempts: Record<string, ExamAttempt> = {}
) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState<string>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [activeTab, setActiveTab] = useState<TabType>('available')

  const availableSubjects = useMemo(() => {
    if (!exams || exams.length === 0) return []
    const subjects = [...new Set(exams.map(e => e.subject))].filter(Boolean)
    return subjects.sort()
  }, [exams])

  const getExamStatus = useCallback((exam: Exam): ExamStatus => {
    if (!exam) return 'available'
    
    const attempt = examAttempts[exam.id]
    const now = new Date()
    
    if (attempt) {
      // ✅ Include all completion statuses
      if (attempt.status === 'completed' || 
          attempt.status === 'graded' || 
          attempt.status === 'pending_theory' ||
          attempt.status === 'terminated') {
        return 'completed'
      }
      
      if (attempt.status === 'in_progress') {
        return 'in_progress'
      }
    }
    
    if (exam.starts_at && new Date(exam.starts_at) > now) {
      return 'upcoming'
    }
    
    if (exam.ends_at && new Date(exam.ends_at) < now) {
      return 'expired'
    }
    
    return 'available'
  }, [examAttempts])

  const filteredExams = useMemo(() => {
    if (!exams || exams.length === 0) return []
    
    let filtered = [...exams]

    filtered = filtered.filter(exam => {
      const status = getExamStatus(exam)
      
      switch (activeTab) {
        case 'available':
          return status === 'available' || status === 'in_progress'
        case 'completed':
          // ✅ 'completed' tab shows exams with 'completed' status
          return status === 'completed'
        case 'expired':
          return status === 'expired'
        case 'upcoming':
          return status === 'upcoming'
        default:
          return true
      }
    })

    if (selectedSubject !== 'all') {
      filtered = filtered.filter(e => e.subject === selectedSubject)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        e =>
          e.title.toLowerCase().includes(query) ||
          e.subject.toLowerCase().includes(query) ||
          (e.class && e.class.toLowerCase().includes(query)) ||
          false
      )
    }

    // ✅ FIXED: Include all ExamStatus types
    const order: Record<ExamStatus, number> = { 
      upcoming: 0, 
      available: 1, 
      in_progress: 1,
      completed: 2, 
      expired: 3,
      graded: 2,           // ✅ Added
      pending_theory: 2    // ✅ Added
    }
    
    return filtered.sort((a, b) => {
      const statusA = getExamStatus(a)
      const statusB = getExamStatus(b)
      return (order[statusA] ?? 99) - (order[statusB] ?? 99)
    })
  }, [exams, activeTab, selectedSubject, searchQuery, getExamStatus])

  const tabCounts = useMemo(() => {
    if (!exams || exams.length === 0) {
      return { available: 0, completed: 0, expired: 0, upcoming: 0 }
    }
    
    const counts = { available: 0, completed: 0, expired: 0, upcoming: 0 }
    
    exams.forEach(exam => {
      const status = getExamStatus(exam)
      switch (status) {
        case 'available':
        case 'in_progress':
          counts.available++
          break
        case 'completed':
          counts.completed++
          break
        case 'expired':
          counts.expired++
          break
        case 'upcoming':
          counts.upcoming++
          break
      }
    })
    
    return counts
  }, [exams, getExamStatus])

  const resetFilters = useCallback(() => {
    setSearchQuery('')
    setSelectedSubject('all')
    setActiveTab('available')
  }, [])

  const getSubjectConfigWithFallback = useCallback((subject: string): SubjectConfig => {
    try {
      const config = getSubjectConfig(subject)
      return config
    } catch (error) {
      return {
        icon: null,
        color: 'bg-slate-500',
        bgColor: 'bg-slate-50',
        label: subject
      }
    }
  }, [])

  return {
    searchQuery,
    setSearchQuery,
    selectedSubject,
    setSelectedSubject,
    viewMode,
    setViewMode,
    activeTab,
    setActiveTab,
    filteredExams,
    availableSubjects,
    tabCounts,
    getExamStatus,
    getSubjectConfig: getSubjectConfigWithFallback,
    resetFilters,
  }
}