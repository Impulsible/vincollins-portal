// src/app/student/exams/hooks/useExamFilters.ts
'use client'

import { useState, useMemo } from 'react'
import type { Exam, ExamAttempt, ViewMode, TabType, ExamStatus } from '../types'
import { getSubjectConfig } from '../utils'

export function useExamFilters(
  exams: Exam[],
  examAttempts: Record<string, ExamAttempt>
) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState<string>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [activeTab, setActiveTab] = useState<TabType>('available')

  // Get unique subjects from exams
  const availableSubjects = useMemo(() => {
    const subjects = [...new Set(exams.map(e => e.subject))]
    return subjects.sort()
  }, [exams])

  // Apply filters
  const filteredExams = useMemo(() => {
    let filtered = [...exams]

    // Subject filter
    if (selectedSubject !== 'all') {
      filtered = filtered.filter(e => e.subject === selectedSubject)
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        e =>
          e.title.toLowerCase().includes(query) ||
          e.subject.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [exams, selectedSubject, searchQuery])

  // Determine exam status
  function getExamStatus(exam: Exam): ExamStatus {
    const attempt = examAttempts[exam.id]
    
    // In-progress exams are still "available" so student can resume
    if (attempt?.status === 'in_progress') return 'available'
    
    // Completed/graded/pending_theory = completed
    if (attempt?.status === 'completed' || 
        attempt?.status === 'graded' || 
        attempt?.status === 'pending_theory') {
      return 'completed'
    }
    
    // Terminated = completed (student can't retake but can view result)
    if (attempt?.status === 'terminated') return 'completed'
    
    // Check dates
    const now = new Date()
    if (exam.starts_at && new Date(exam.starts_at) > now) return 'upcoming'
    if (exam.ends_at && new Date(exam.ends_at) < now) return 'expired'
    
    return 'available'
  }

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
    getExamStatus,
    getSubjectConfig,
  }
}