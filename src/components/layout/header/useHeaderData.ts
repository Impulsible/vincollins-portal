// components/layout/header/useHeaderData.ts - FINAL VERSION
'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/contexts/UserContext'
import { HeaderUser, SchoolSettings, Notification, UserRole } from './types'
import { getCachedAuthState, getCachedHeaderUser } from '@/lib/auth-utils'

// ✅ Get cached auth state synchronously (runs before React renders)
const cachedHeaderUser = getCachedHeaderUser()
const cachedIsAuthenticated = getCachedAuthState().isAuthenticated

export function useHeaderData() {
  const { user: contextUser, isAuthenticated: contextIsAuthenticated, loading: authLoading } = useUser()
  
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [mounted, setMounted] = useState(false)
  
  // ✅ Use context user when available, otherwise use cached user (loaded synchronously)
  const user: HeaderUser | null = useMemo(() => {
    if (contextUser) {
      const displayName = contextUser.full_name || contextUser.first_name || 'User'
      const nameParts = displayName.split(' ')
      const firstName = nameParts.length >= 2 ? nameParts[1] : nameParts[0]
      
      let role: UserRole = 'student'
      const contextRole = contextUser.role?.toLowerCase()
      if (contextRole === 'admin') role = 'admin'
      else if (contextRole === 'staff' || contextRole === 'teacher') role = 'teacher'
      else if (contextRole === 'student') role = 'student'

      return {
        id: contextUser.id,
        name: displayName,
        firstName,
        email: contextUser.email || '',
        role,
        avatar: contextUser.avatar_url || contextUser.photo_url || undefined,
        isAuthenticated: true
      }
    }
    return cachedHeaderUser
  }, [contextUser])

  // ✅ Immediate authentication state (no waiting)
  const immediateIsAuthenticated = cachedIsAuthenticated || !!contextUser

  useEffect(() => {
    setMounted(true)
  }, [])

  // Load school settings in background
  useEffect(() => {
    if (!mounted) return
    
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('school_settings')
          .select('school_name, logo_path, school_phone, school_email')
          .single()
        
        if (!error && data) {
          setSchoolSettings(data as SchoolSettings)
        }
      } catch {
        // Silently fail
      }
    }
    fetchSettings()
  }, [mounted])

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)
      
      if (!error && data) {
        setNotifications(data as Notification[])
        setUnreadCount(data.filter((n: any) => !n.read).length)
      }
    } catch {
      // Silently fail
    }
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return
    
    loadNotifications()
    
    const interval = setInterval(loadNotifications, 60000)
    return () => clearInterval(interval)
  }, [user?.id, loadNotifications])

  const markAsRead = useCallback(async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
    
    try {
      await supabase.from('notifications').update({ read: true }).eq('id', id)
    } catch {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: false } : n))
      setUnreadCount(prev => prev + 1)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return
    
    const previousNotifications = [...notifications]
    const previousUnreadCount = unreadCount
    
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
    
    try {
      await supabase.from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)
    } catch {
      setNotifications(previousNotifications)
      setUnreadCount(previousUnreadCount)
    }
  }, [user?.id, notifications, unreadCount])

  const deleteNotification = useCallback(async (id: string) => {
    const deletedNotification = notifications.find(n => n.id === id)
    const wasUnread = deletedNotification && !deletedNotification.read
    
    setNotifications(prev => prev.filter(n => n.id !== id))
    if (wasUnread) {
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
    
    try {
      await supabase.from('notifications').delete().eq('id', id)
    } catch {
      if (deletedNotification) {
        setNotifications(prev => [...prev, deletedNotification])
        if (wasUnread) {
          setUnreadCount(prev => prev + 1)
        }
      }
    }
  }, [notifications])

  // ✅ Header is ready immediately if we have cached user
  const isLoading = !mounted || (authLoading && !cachedHeaderUser)

  return { 
    user,
    schoolSettings, 
    notifications, 
    unreadCount,
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    isLoading,
    isAuthenticated: immediateIsAuthenticated
  }
}