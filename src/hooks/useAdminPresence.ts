// hooks/useAdminPresence.ts
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface AdminProfile {
  id?: string
  full_name?: string
  email?: string
  photo_url?: string
}

export interface OnlineAdmin {
  id: string
  full_name: string
  email?: string
  photo_url?: string
  joinedAt: string
  lastSeen: string
  page: string
  status: 'online'
}

interface UseAdminPresenceOptions {
  adminProfile: AdminProfile | null
  activeTab?: string
  channelName?: string
}

export function useAdminPresence({
  adminProfile,
  activeTab = 'dashboard',
  channelName = 'admin-live-users',
}: UseAdminPresenceOptions) {
  const [onlineAdmins, setOnlineAdmins] = useState<OnlineAdmin[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const joinedAtRef = useRef<string>(new Date().toISOString())

  useEffect(() => {
    if (!adminProfile?.id) return

    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: adminProfile.id,
        },
      },
    })

    const syncPresenceState = () => {
      const state = channel.presenceState<Record<string, unknown>[]>()
      const flattened: OnlineAdmin[] = []

      Object.entries(state).forEach(([key, entries]) => {
        entries.forEach((entry) => {
          const item = entry as unknown as Record<string, unknown>

          flattened.push({
            id: key,
            full_name: String(item.full_name ?? 'Administrator'),
            email: item.email ? String(item.email) : undefined,
            photo_url: item.photo_url ? String(item.photo_url) : undefined,
            joinedAt: String(item.joinedAt ?? new Date().toISOString()),
            lastSeen: String(item.lastSeen ?? new Date().toISOString()),
            page: String(item.page ?? 'dashboard'),
            status: 'online',
          })
        })
      })

      setOnlineAdmins(flattened)
    }

    channel
      .on('presence', { event: 'sync' }, () => {
        syncPresenceState()
      })
      .on('presence', { event: 'join' }, () => {
        syncPresenceState()
      })
      .on('presence', { event: 'leave' }, () => {
        syncPresenceState()
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)

          await channel.track({
            full_name: adminProfile.full_name ?? 'Administrator',
            email: adminProfile.email ?? '',
            photo_url: adminProfile.photo_url ?? '',
            joinedAt: joinedAtRef.current,
            lastSeen: new Date().toISOString(),
            page: activeTab,
          })
        }
      })

    const heartbeat = window.setInterval(async () => {
      await channel.track({
        full_name: adminProfile.full_name ?? 'Administrator',
        email: adminProfile.email ?? '',
        photo_url: adminProfile.photo_url ?? '',
        joinedAt: joinedAtRef.current,
        lastSeen: new Date().toISOString(),
        page: activeTab,
      })
    }, 15000)

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        await channel.track({
          full_name: adminProfile.full_name ?? 'Administrator',
          email: adminProfile.email ?? '',
          photo_url: adminProfile.photo_url ?? '',
          joinedAt: joinedAtRef.current,
          lastSeen: new Date().toISOString(),
          page: activeTab,
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.clearInterval(heartbeat)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      setIsConnected(false)
      void supabase.removeChannel(channel)
    }
  }, [
    adminProfile?.id,
    adminProfile?.full_name,
    adminProfile?.email,
    adminProfile?.photo_url,
    activeTab,
    channelName,
  ])

  const onlineCount = useMemo(() => onlineAdmins.length, [onlineAdmins])

  return {
    onlineAdmins,
    onlineCount,
    isConnected,
  }
}