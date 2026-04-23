import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { StudentProfile } from '../types'
import { formatFullName, formatDisplayName } from '../utils/nameFormatter'
import { getSubjectCountForClass } from '../utils/constants'

export function useStudentProfile() {
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [authChecking, setAuthChecking] = useState(true)

  useEffect(() => {
    let isMounted = true
    
    const checkAuth = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          if (isMounted) window.location.replace('/portal')
          return
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, first_name, middle_name, last_name, full_name, display_name, email, class, department, vin_id, photo_url, admission_year, role, subject_count')
          .eq('id', user.id)
          .maybeSingle()

        if (isMounted) {
          const fallbackName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student'
          
          const fullName = formatFullName(
            profileData?.first_name || null,
            profileData?.last_name || null,
            profileData?.middle_name || null,
            profileData?.full_name || fallbackName
          )
          
          const displayName = profileData?.display_name || 
            (profileData?.first_name && profileData?.last_name 
              ? `${profileData.last_name} ${profileData.first_name}${profileData.middle_name ? ` ${profileData.middle_name}` : ''}`
              : fullName)
          
          const studentClass = profileData?.class || 'Not Assigned'
          const calculatedSubjects = profileData?.subject_count || getSubjectCountForClass(studentClass)
          
          setProfile({
            id: user.id,
            first_name: profileData?.first_name || null,
            middle_name: profileData?.middle_name || null,
            last_name: profileData?.last_name || null,
            full_name: fullName,
            display_name: displayName,
            email: profileData?.email || user.email || '',
            class: studentClass,
            department: profileData?.department || 'General',
            vin_id: profileData?.vin_id,
            photo_url: profileData?.photo_url || null,
            admission_year: profileData?.admission_year || new Date().getFullYear(),
            role: profileData?.role || 'student',
            subject_count: calculatedSubjects
          })
          
          setAuthChecking(false)
        }
      } catch (err) {
        console.error('Auth check error:', err)
        if (isMounted) setAuthChecking(false)
      }
    }

    checkAuth()
    return () => { isMounted = false }
  }, [])

  return { profile, authChecking, setProfile }
}