// src/app/student/exams/hooks/useExamFilters.ts - COMPLETE FIXED VERSION

'use client'

import { useState, useMemo, useCallback } from 'react'
import type { Exam, ExamAttempt, SubjectConfig } from '../types'
import { getSubjectConfig } from '../utils'

// ✅ Define types locally (don't import them)
export type ViewMode = 'grid' | 'list'
export type TabType = 'available' | 'completed' | 'expired' | 'upcoming'

// ✅ Use the same type for status
export type ExamStatus = 'available' | 'completed' | 'expired' | 'upcoming' | 'in_progress'

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
    
    // Check if there's an attempt first
    if (attempt) {
      if (attempt.status === 'completed' || 
          attempt.status === 'graded' || 
          attempt.status === 'pending_theory' ||
          attempt.status === 'terminated') {
        return 'completed'
      }
      
      if (attempt.status === 'in_progress') {
        return 'available'
      }
    }
    
    // No attempt - check dates
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

    // Filter by active tab
    filtered = filtered.filter(exam => {
      const status = getExamStatus(exam)
      
      // ✅ Tab filtering logic - fixed the TypeScript error
      if (activeTab === 'available') {
        return status === 'available' || status === 'upcoming'
      }
      if (activeTab === 'completed') {
        return status === 'completed'
      }
      if (activeTab === 'expired') {
        return status === 'expired'
      }
      if (activeTab === 'upcoming') {
        return status === 'upcoming'
      }
      return true
    })

    // Filter by subject
    if (selectedSubject !== 'all') {
      filtered = filtered.filter(e => e.subject === selectedSubject)
    }

    // Filter by search query
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

    // Sort: Upcoming first, then available, then completed, then expired
    const order: Record<ExamStatus, number> = { 
      upcoming: 0, 
      available: 1, 
      completed: 2, 
      expired: 3,
      in_progress: 1
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
      // ✅ Type-safe count increment
      if (status === 'available') counts.available++
      else if (status === 'completed') counts.completed++
      else if (status === 'expired') counts.expired++
      else if (status === 'upcoming') counts.upcoming++
    })
    
    return counts
  }, [exams, getExamStatus])

  const resetFilters = useCallback(() => {
    setSearchQuery('')
    setSelectedSubject('all')
    setActiveTab('available')
  }, [])

  return {
    // State
    searchQuery,
    setSearchQuery,
    selectedSubject,
    setSelectedSubject,
    viewMode,
    setViewMode,
    activeTab,
    setActiveTab,
    
    // Data
    filteredExams,
    availableSubjects,
    tabCounts,
    
    // Functions
    getExamStatus,
    getSubjectConfig,
    resetFilters,
  }
}