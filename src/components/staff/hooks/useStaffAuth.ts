// ============================================
// STAFF AUTHENTICATION HOOK
// ============================================

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { StaffProfile } from '@/lib/staff/types'
import { formatFullName } from '@/lib/staff/utils'

export function useStaffAuth() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<StaffProfile | null>(null)

  useEffect(() => {
    let mounted = true

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          router.replace('/portal')
          return
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('role, full_name, email, department, position, photo_url, class')
          .eq('id', session.user.id)
          .maybeSingle()

        if (mounted) {
          const rawFullName = profileData?.full_name || 
                            session.user.user_metadata?.full_name || 
                            session.user.email?.split('@')[0] || 
                            'Staff User'
          
          setProfile({
            id: session.user.id,
            full_name: formatFullName(rawFullName),
            email: profileData?.email || session.user.email || '',
            role: profileData?.role || 'teacher',
            department: profileData?.department || 'General',
            position: profileData?.position || 'Teacher',
            photo_url: profileData?.photo_url || null,
            class: profileData?.class || null
          })
          
          setLoading(false)
        }
      } catch (err) {
        console.error('Auth check error:', err)
        if (mounted) setLoading(false)
      }
    }
    
    checkAuth()
    
    return () => {
      mounted = false
    }
  }, [router])

  return { profile, loading }
}