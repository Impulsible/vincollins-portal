// src/app/student/hooks/useStudentProfile.ts
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { StudentProfile } from '../types'

export function useStudentProfile() {
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [authChecking, setAuthChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setError(null)
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          throw sessionError
        }
        
        if (!session) {
          setAuthChecking(false)
          setLoading(false)
          return
        }

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profileError) {
          throw profileError
        }

        if (profileData) {
          const studentProfile: StudentProfile = {
            id: profileData.id,
            full_name: profileData.full_name || 'Student',
            first_name: profileData.first_name || null,
            last_name: profileData.last_name || null,
            middle_name: profileData.middle_name || null,
            display_name: profileData.display_name || null,
            email: profileData.email,
            class: profileData.class || 'Not Assigned',
            department: profileData.department || null,
            photo_url: profileData.photo_url || null,
            vin_id: profileData.vin_id || null,
            admission_year: profileData.admission_year ? Number(profileData.admission_year) : null,
            subject_count: profileData.subject_count ? Number(profileData.subject_count) : null,
            role: profileData.role || 'student',
            phone: profileData.phone || null,
            address: profileData.address || null,
            parent_email: profileData.parent_email || null,
            parent_phone: profileData.parent_phone || null,
            date_of_birth: profileData.date_of_birth || null,
            gender: profileData.gender || null,
            current_term: profileData.current_term || null,
            session_year: profileData.session_year || null,
            created_at: profileData.created_at,
            updated_at: profileData.updated_at
          }
          
          setProfile(studentProfile)
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
        setError(error instanceof Error ? error.message : 'Failed to fetch profile')
      } finally {
        setAuthChecking(false)
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const refreshProfile = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        return
      }

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error) throw error

      if (profileData) {
        setProfile({
          id: profileData.id,
          full_name: profileData.full_name || 'Student',
          first_name: profileData.first_name || null,
          last_name: profileData.last_name || null,
          middle_name: profileData.middle_name || null,
          display_name: profileData.display_name || null,
          email: profileData.email,
          class: profileData.class || 'Not Assigned',
          department: profileData.department || null,
          photo_url: profileData.photo_url || null,
          vin_id: profileData.vin_id || null,
          admission_year: profileData.admission_year ? Number(profileData.admission_year) : null,
          subject_count: profileData.subject_count ? Number(profileData.subject_count) : null,
          role: profileData.role || 'student',
          phone: profileData.phone || null,
          address: profileData.address || null,
          parent_email: profileData.parent_email || null,
          parent_phone: profileData.parent_phone || null,
          date_of_birth: profileData.date_of_birth || null,
          gender: profileData.gender || null,
          current_term: profileData.current_term || null,
          session_year: profileData.session_year || null,
          created_at: profileData.created_at,
          updated_at: profileData.updated_at
        })
      }
    } catch (error) {
      console.error('Error refreshing profile:', error)
    } finally {
      setLoading(false)
    }
  }

  return { 
    profile, 
    loading, 
    authChecking, 
    error,
    setProfile,
    refreshProfile 
  }
}