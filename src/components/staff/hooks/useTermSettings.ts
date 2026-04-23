// components/staff/hooks/useTermSettings.ts - FIXED TYPESCRIPT ERRORS
'use client'

import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// Current term constants (fallback)
const CURRENT_TERM = 'third'
const CURRENT_SESSION = '2025/2026'
const TERM_NAMES: Record<string, string> = {
  first: 'First Term',
  second: 'Second Term',
  third: 'Third Term'
}

// Define the TermInfo interface locally to match what components expect
export interface TermInfo {
  termName: string
  term?: string           // For backward compatibility
  sessionYear: string
  termCode?: string
  currentWeek: number
  totalWeeks: number
  weekProgress: number
  startDate?: string
  endDate?: string
  displayWeek?: string
  isActive?: boolean      // Added for type compatibility
}

export function useTermSettings() {
  const [termInfo, setTermInfo] = useState<TermInfo>({
    termName: TERM_NAMES[CURRENT_TERM],
    term: TERM_NAMES[CURRENT_TERM],        // Added for backward compatibility
    sessionYear: CURRENT_SESSION,
    termCode: CURRENT_TERM,
    currentWeek: 0,
    totalWeeks: 13,
    weekProgress: 0,
    startDate: '2026-05-04',
    endDate: '2026-08-01',
    displayWeek: 'Starts May 4',
    isActive: true                          // Added for type compatibility
  })
  
  const [loading, setLoading] = useState(true)

  const loadTermSettings = useCallback(async () => {
    try {
      // Try to fetch from database
      const { data: currentTermData } = await supabase
        .from('terms')
        .select('*')
        .eq('is_current', true)
        .single()

      if (currentTermData) {
        const totalWeeks = currentTermData.total_weeks || 13
        const currentWeek = currentTermData.current_week || 1
        const weekProgress = (currentWeek / totalWeeks) * 100
        
        setTermInfo({
          termName: currentTermData.term_name || TERM_NAMES[currentTermData.term_code] || 'Third Term',
          term: currentTermData.term_name || TERM_NAMES[currentTermData.term_code] || 'Third Term',
          sessionYear: currentTermData.session_year || CURRENT_SESSION,
          termCode: currentTermData.term_code || CURRENT_TERM,
          currentWeek: currentWeek,
          totalWeeks: totalWeeks,
          weekProgress: weekProgress,
          startDate: currentTermData.start_date || '',
          endDate: currentTermData.end_date || '',
          displayWeek: `Week ${currentWeek}/${totalWeeks}`,
          isActive: currentTermData.is_current || true
        })
      } else {
        // Calculate based on May 4, 2026
        calculateFallbackTermInfo()
      }
    } catch (error) {
      console.error('Error loading term settings:', error)
      // Use fallback calculation
      calculateFallbackTermInfo()
    } finally {
      setLoading(false)
    }
  }, [])

  const calculateFallbackTermInfo = () => {
    const TERM_START_DATE = new Date('2026-05-04')
    const TERM_END_DATE = new Date('2026-08-01')
    const today = new Date()
    
    const totalWeeks = 13
    
    let currentWeek: number
    let weekProgress: number
    let displayWeek: string
    let isActive: boolean
    
    if (today < TERM_START_DATE) {
      currentWeek = 0
      weekProgress = 0
      displayWeek = 'Starts May 4'
      isActive = false
    } else if (today > TERM_END_DATE) {
      currentWeek = totalWeeks
      weekProgress = 100
      displayWeek = 'Term Ended'
      isActive = false
    } else {
      const msPerWeek = 7 * 24 * 60 * 60 * 1000
      const weeksPassed = Math.floor((today.getTime() - TERM_START_DATE.getTime()) / msPerWeek) + 1
      currentWeek = Math.min(Math.max(1, weeksPassed), totalWeeks)
      weekProgress = (currentWeek / totalWeeks) * 100
      displayWeek = `Week ${currentWeek}/${totalWeeks}`
      isActive = true
    }

    setTermInfo({
      termName: TERM_NAMES[CURRENT_TERM],
      term: TERM_NAMES[CURRENT_TERM],
      sessionYear: CURRENT_SESSION,
      termCode: CURRENT_TERM,
      currentWeek: currentWeek,
      totalWeeks: totalWeeks,
      weekProgress: weekProgress,
      startDate: '2026-05-04',
      endDate: '2026-08-01',
      displayWeek: displayWeek,
      isActive: isActive
    })
  }

  useEffect(() => {
    loadTermSettings()
  }, [loadTermSettings])

  return { 
    termInfo, 
    loading,
    loadTermSettings 
  }
}