// src/hooks/useStudentProfile.ts
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface StudentProfile {
  id: string
  full_name: string
  email: string
  class: string
  department?: string
  photo_url?: string
  vin_id?: string
  first_name?: string
  last_name?: string
  middle_name?: string
  display_name?: string
  admission_year?: number
  subject_count?: number
  role?: string
}

export function useStudentProfile() {
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [authChecking, setAuthChecking] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          setAuthChecking(false)
          setLoading(false)
          return
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profileData) {
          setProfile({
            id: profileData.id,
            full_name: profileData.full_name || 'Student',
            first_name: profileData.first_name,
            last_name: profileData.last_name,
            middle_name: profileData.middle_name,
            display_name: profileData.display_name,
            email: profileData.email,
            class: profileData.class || 'Not Assigned',
            department: profileData.department,
            photo_url: profileData.photo_url,
            vin_id: profileData.vin_id,
            admission_year: profileData.admission_year,
            subject_count: profileData.subject_count,
            role: profileData.role
          })
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      } finally {
        setAuthChecking(false)
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  return { profile, loading, authChecking }
}