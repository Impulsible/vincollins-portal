// src/contexts/StaffContext.tsx - IMPROVED
'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

interface StaffProfile {
  id: string
  full_name?: string
  first_name?: string
  last_name?: string
  email?: string
  department?: string
  photo_url?: string | null
  role?: string
}

interface StaffContextType {
  profile: StaffProfile | null
  totalStudents: number
  totalExams: number
  pendingGrading: number
  loading: boolean
  refreshStats: () => Promise<void>
}

const StaffContext = createContext<StaffContextType | null>(null)

export function StaffProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<StaffProfile | null>(null)
  const [totalStudents, setTotalStudents] = useState(0)
  const [totalExams, setTotalExams] = useState(0)
  const [pendingGrading, setPendingGrading] = useState(0)
  const [loading, setLoading] = useState(true)

  const loadStats = useCallback(async (userId: string) => {
    try {
      const [studentsRes, examsRes, pendingRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('exams').select('*', { count: 'exact', head: true }).eq('created_by', userId),
        supabase.from('exam_attempts').select('*', { count: 'exact', head: true }).in('status', ['submitted', 'pending_theory'])
      ])

      if (studentsRes.count !== null) setTotalStudents(studentsRes.count)
      if (examsRes.count !== null) setTotalExams(examsRes.count)
      if (pendingRes.count !== null) setPendingGrading(pendingRes.count)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }, [])

  const refreshStats = useCallback(async () => {
    if (profile?.id) {
      await loadStats(profile.id)
    }
  }, [profile?.id, loadStats])

  useEffect(() => {
    let isMounted = true

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          if (isMounted) setLoading(false)
          return
        }

        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (data && isMounted) {
          setProfile(data)
          await loadStats(data.id)
        }
      } catch (error) {
        console.error('Error initializing StaffContext:', error)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    init()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setProfile(null)
        setTotalStudents(0)
        setTotalExams(0)
        setPendingGrading(0)
      }
      
      if (event === 'SIGNED_IN' && session?.user && isMounted) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (data) {
          setProfile(data)
          await loadStats(data.id)
        }
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [loadStats])

  return (
    <StaffContext.Provider value={{ 
      profile, 
      totalStudents, 
      totalExams, 
      pendingGrading, 
      loading,
      refreshStats 
    }}>
      {children}
    </StaffContext.Provider>
  )
}

export function useStaff() {
  const context = useContext(StaffContext)
  if (!context) {
    throw new Error('useStaff must be used within a StaffProvider')
  }
  return context
}