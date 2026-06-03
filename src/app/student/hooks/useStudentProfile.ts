// src/app/student/hooks/useStudentProfile.ts
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { StudentProfile } from '../types'

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

        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (error) throw error

        if (profileData) {
          console.log('👤 Student profile loaded:', {
            name: profileData.full_name,
            class: profileData.class,
            role: profileData.role
          })

          setProfile({
            id: profileData.id,
            full_name: profileData.full_name || 'Student',
            first_name: profileData.first_name || null,
            last_name: profileData.last_name || null,
            middle_name: profileData.middle_name || null,
            display_name: profileData.display_name || null,
            email: profileData.email,
            class: profileData.class || 'Not Assigned',
            department: profileData.department || 'General',
            phone: profileData.phone || '',
            address: profileData.address || '',
            admission_year: profileData.admission_year || new Date().getFullYear(),
            photo_url: profileData.photo_url || null,
            cover_photo_url: profileData.cover_photo_url || null,
            avatar_url: profileData.avatar_url || null,
            is_active: profileData.is_active ?? true,
            created_at: profileData.created_at || new Date().toISOString(),
            bio: profileData.bio || '',
            vin_id: profileData.vin_id || '',
            admission_number: profileData.admission_number || '',
            role: profileData.role || 'student'  // ✅ This now matches the type
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

  return { profile, loading, authChecking, setProfile }
}