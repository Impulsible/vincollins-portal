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

// Helper: check if a class belongs to an SS year group
const isSSYear = (studentClass: string, year: string): boolean => {
  const upper = studentClass.toUpperCase()
  if (year === 'SS1') return upper.includes('SS1') || upper.includes('SS 1')
  if (year === 'SS2') return upper.includes('SS2') || upper.includes('SS 2')
  if (year === 'SS3') return upper.includes('SS3') || upper.includes('SS 3')
  return false
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

      // Also add to the general SS year group if applicable
      if (className.startsWith('SS1')) {
        if (!groups['SS1']) groups['SS1'] = { students: [], count: 0, onlineCount: 0 }
        groups['SS1'].students.push(student)
        groups['SS1'].count++
      } else if (className.startsWith('SS2')) {
        if (!groups['SS2']) groups['SS2'] = { students: [], count: 0, onlineCount: 0 }
        groups['SS2'].students.push(student)
        groups['SS2'].count++
      } else if (className.startsWith('SS3')) {
        if (!groups['SS3']) groups['SS3'] = { students: [], count: 0, onlineCount: 0 }
        groups['SS3'].students.push(student)
        groups['SS3'].count++
      }
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

    const filterByClass = (filterValue: string) => {
      // If selecting a general SS class (SS1, SS2, SS3), show all departments
      if (filterValue === 'SS1' || filterValue === 'SS2' || filterValue === 'SS3') {
        return filtered.filter(s => isSSYear(s.class, filterValue))
      }
      // For all other classes (JSS or specific departments), exact match
      return filtered.filter(s => s.class === filterValue)
    }

    if (selectedClass) {
      filtered = filterByClass(selectedClass)
    } else if (classFilter !== 'all') {
      filtered = filterByClass(classFilter)
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