// src/components/admin/students/hooks/useStudentPresence.ts

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'

type PresenceStatus = 'online' | 'away' | 'offline'

interface PresencePayload {
  user_id?: string
  status?: string
  last_seen?: string
  online_at?: string
  away_at?: string
  last_heartbeat?: string
  [key: string]: any
}

interface UseStudentPresenceReturn {
  onlineStudents: Set<string>
  awayStudents: Set<string>
  isConnected: boolean
  onlineCount: number
  awayCount: number
  getStatus: (studentId: string) => PresenceStatus
  getLastSeen: (studentId: string) => string
}

export function useStudentPresence(students: any[]): UseStudentPresenceReturn {
  const [onlineStudents, setOnlineStudents] = useState<Set<string>>(new Set())
  const [awayStudents, setAwayStudents] = useState<Set<string>>(new Set())
  const [lastSeenMap, setLastSeenMap] = useState<Map<string, string>>(new Map())
  const [isConnected, setIsConnected] = useState(false)
  const channelRef = useRef<any>(null)

  useEffect(() => {
    if (!students.length) return

    let mounted = true
    const validStudentIds = new Set(students.map(s => s.id))
    
    // Create channel for listening
    const channel = supabase.channel('online-students')
    channelRef.current = channel

    // Listen for presence sync - this gets all current presence data
    channel.on('presence', { event: 'sync' }, () => {
      if (!mounted) return
      
      const presenceState = channel.presenceState()
      console.log('📡 Presence state received:', presenceState)
      
      const online = new Set<string>()
      const away = new Set<string>()
      const lastSeen = new Map<string, string>()
      
      // Parse presence data
      Object.entries(presenceState).forEach(([key, presences]) => {
        const presence = presences?.[0] as PresencePayload
        if (!presence) return
        
        const userId = presence.user_id || key
        console.log(`👤 User ${userId} status: ${presence.status}`)
        
        if (userId && validStudentIds.has(userId)) {
          if (presence.status === 'online') {
            online.add(userId)
          } else if (presence.status === 'away') {
            away.add(userId)
          }
          
          const lastSeenTime = presence.last_seen || presence.online_at || presence.away_at
          if (lastSeenTime) {
            lastSeen.set(userId, lastSeenTime)
          }
        }
      })
      
      setOnlineStudents(online)
      setAwayStudents(away)
      setLastSeenMap(lastSeen)
      setIsConnected(true)
      console.log(`📊 Online: ${online.size}, Away: ${away.size}`)
    })

    // Listen for join events - when a user comes online
    channel.on('presence', { event: 'join' }, ({ newPresences }: any) => {
      if (!mounted) return
      
      console.log('🎉 New presence join:', newPresences)
      newPresences?.forEach((presence: PresencePayload) => {
        const userId = presence.user_id
        if (userId && validStudentIds.has(userId)) {
          if (presence.status === 'online') {
            setOnlineStudents(prev => new Set([...prev, userId]))
            setAwayStudents(prev => {
              const newSet = new Set(prev)
              newSet.delete(userId)
              return newSet
            })
            console.log(`✅ Student ${userId} came online`)
          } else if (presence.status === 'away') {
            setAwayStudents(prev => new Set([...prev, userId]))
            setOnlineStudents(prev => {
              const newSet = new Set(prev)
              newSet.delete(userId)
              return newSet
            })
          }
          
          const lastSeenTime = presence.last_seen || presence.online_at || presence.away_at
          if (lastSeenTime) {
            setLastSeenMap(prev => {
              const newMap = new Map(prev)
              newMap.set(userId, lastSeenTime)
              return newMap
            })
          }
        }
      })
    })

    // Listen for leave events - when a user goes offline
    channel.on('presence', { event: 'leave' }, ({ leftPresences }: any) => {
      if (!mounted) return
      
      console.log('👋 Presence leave:', leftPresences)
      leftPresences?.forEach((presence: PresencePayload) => {
        const userId = presence.user_id
        if (userId && validStudentIds.has(userId)) {
          setOnlineStudents(prev => {
            const newSet = new Set(prev)
            newSet.delete(userId)
            return newSet
          })
          setAwayStudents(prev => {
            const newSet = new Set(prev)
            newSet.delete(userId)
            return newSet
          })
          setLastSeenMap(prev => {
            const newMap = new Map(prev)
            newMap.set(userId, new Date().toISOString())
            return newMap
          })
          console.log(`❌ Student ${userId} went offline`)
        }
      })
    })

    // Subscribe to the channel
    channel.subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        console.log('🔌 Presence channel subscribed successfully')
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Channel error')
      }
    })

    return () => {
      mounted = false
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        console.log('🔌 Presence channel unsubscribed')
      }
    }
  }, [students])

  const getStatus = useCallback(
    (studentId: string): PresenceStatus => {
      if (onlineStudents.has(studentId)) return 'online'
      if (awayStudents.has(studentId)) return 'away'
      return 'offline'
    },
    [onlineStudents, awayStudents]
  )

  const getLastSeen = useCallback(
    (studentId: string): string => {
      return lastSeenMap.get(studentId) || ''
    },
    [lastSeenMap]
  )

  return {
    onlineStudents,
    awayStudents,
    isConnected,
    onlineCount: onlineStudents.size,
    awayCount: awayStudents.size,
    getStatus,
    getLastSeen,
  }
}

export default useStudentPresence