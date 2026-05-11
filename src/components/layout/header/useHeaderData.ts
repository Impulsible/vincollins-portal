// components/layout/header/useHeaderData.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { HeaderUser, SchoolSettings, Notification, UserRole } from './types'

export function useHeaderData() {
  const [user, setUser] = useState<HeaderUser | null>(null)
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // ✅ Fetch user in background - NON-BLOCKING
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) return

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profile) {
          const displayName = profile.display_name || profile.full_name || 'User'
          const nameParts = displayName.split(' ')
          const firstName = nameParts.length >= 2 ? nameParts[1] : nameParts[0]
          const role: UserRole = profile.role === 'staff' ? 'teacher' : (profile.role as UserRole) || 'student'

          setUser({
            id: profile.id,
            name: displayName,
            firstName,
            email: profile.email || session.user.email || '',
            role,
            avatar: profile.photo_url || profile.avatar_url,
            isAuthenticated: true
          })
        }
      } catch {
        // Silently fail - header still works with defaults
      }
    }
    fetchUser()
  }, [])

  // ✅ Fetch school settings in background
  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await supabase
          .from('school_settings')
          .select('school_name, logo_path, school_phone, school_email')
          .single()
        if (data) setSchoolSettings(data)
      } catch {}
    }
    fetch()
  }, [])

  // ✅ Fetch notifications (only when user loaded)
  const loadNotifications = useCallback(async () => {
    if (!user?.id) return
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)
      if (data) {
        setNotifications(data)
        setUnreadCount(data.filter(n => !n.read).length)
      }
    } catch {}
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return
    loadNotifications()
    const interval = setInterval(loadNotifications, 60000)
    return () => clearInterval(interval)
  }, [user?.id, loadNotifications])

  const markAsRead = async (id: string) => {
    supabase.from('notifications').update({ read: true }).eq('id', id).then(() => {})
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = async () => {
    if (!user?.id) return
    supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false).then(() => {})
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const deleteNotification = async (id: string) => {
    supabase.from('notifications').delete().eq('id', id).then(() => {})
    setNotifications(prev => prev.filter(n => n.id !== id))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  return { 
    user, schoolSettings, notifications, unreadCount,
    markAsRead, markAllAsRead, deleteNotification
  }
}