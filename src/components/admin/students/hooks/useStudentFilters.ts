// components/admin/students/hooks/useStudentFilters.ts

'use client'

import { useState, useMemo } from 'react'
import { Student, ClassGroup, ViewMode } from '../types'
import { CLASSES } from '../constants'
import { normalizeClass } from '../utils'

interface UseStudentFiltersReturn {
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedClass: string | null
  setSelectedClass: (className: string | null) => void
  classFilter: string
  setClassFilter: (filter: string) => void
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  sortedStudents: Student[]
  classGroups: Record<string, ClassGroup>
  filteredStudents: Student[]
}

export function useStudentFilters(students: Student[]): UseStudentFiltersReturn {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClass, setSelectedClass] = useState<string | null>(null)
  const [classFilter, setClassFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('classes')

  // Sort and normalize students
  const sortedStudents = useMemo(() => {
    return [...students]
      .map(student => ({
        ...student,
        class: normalizeClass(student.class),
      }))
      .sort((a, b) =>
        (a.full_name?.toLowerCase() || '').localeCompare(
          b.full_name?.toLowerCase() || ''
        )
      )
  }, [students])

  // Group students by class
  const classGroups = useMemo(() => {
    const groups: Record<string, ClassGroup> = {}

    CLASSES.forEach(cls => {
      groups[cls] = { students: [], count: 0, onlineCount: 0 }
    })

    sortedStudents.forEach(student => {
      const className = student.class
      if (!groups[className]) {
        groups[className] = { students: [], count: 0, onlineCount: 0 }
      }
      groups[className].students.push(student)
      groups[className].count++
    })

    return groups
  }, [sortedStudents])

  // Filter students based on search and class
  const filteredStudents = useMemo(() => {
    let filtered = sortedStudents

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        s =>
          s.full_name?.toLowerCase().includes(query) ||
          s.email?.toLowerCase().includes(query) ||
          s.vin_id?.toLowerCase().includes(query) ||
          s.admission_number?.toLowerCase().includes(query)
      )
    }

    if (selectedClass) {
      filtered = filtered.filter(s => s.class === selectedClass)
    } else if (classFilter !== 'all') {
      filtered = filtered.filter(s => s.class === classFilter)
    }

    return filtered
  }, [sortedStudents, searchQuery, selectedClass, classFilter])

  return {
    searchQuery,
    setSearchQuery,
    selectedClass,
    setSelectedClass,
    classFilter,
    setClassFilter,
    viewMode,
    setViewMode,
    sortedStudents,
    classGroups,
    filteredStudents,
  }
}