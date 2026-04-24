// hooks/useAdminAuth.ts
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface AdminProfile {
  id: string
  full_name: string
  email: string
  role: string
  photo_url?: string
}

function formatFullName(name: string): string {
  if (!name) return ''
  return name.split(/[\s._-]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
}

export function useAdminAuth() {
  const router = useRouter()
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) { router.push('/portal'); return }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('role, full_name, email, photo_url')
          .eq('id', session.user.id)
          .single()

        if (!profileData || !['admin', 'staff'].includes(profileData.role?.toLowerCase())) {
          toast.error('Access denied')
          router.push('/portal')
          return
        }

        setProfile({
          id: session.user.id,
          email: session.user.email || '',
          full_name: formatFullName(profileData.full_name || 'Administrator'),
          role: profileData.role.toLowerCase(),
          photo_url: profileData.photo_url
        })
      } catch (err) {
        router.push('/portal')
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [router])

  return { profile, loading }
}