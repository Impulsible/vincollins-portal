// components/admin/students/hooks/useStudentPresence.ts

'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { PresenceEvent, PresenceStatus, Student } from '../types'

interface UseStudentPresenceReturn {
  onlineStudents: Set<string>
  awayStudents: Set<string>
  isConnected: boolean
  onlineCount: number
  awayCount: number
  getStatus: (studentId: string) => PresenceStatus
  getLastSeen: (studentId: string) => string
}

export function useStudentPresence(students: Student[]): UseStudentPresenceReturn {
  const [onlineStudents, setOnlineStudents] = useState<Set<string>>(new Set())
  const [awayStudents, setAwayStudents] = useState<Set<string>>(new Set())
  const [studentLastSeen, setStudentLastSeen] = useState<Map<string, string>>(new Map())
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!students.length) return

    const presenceChannel = supabase.channel('online-users', {
      config: { presence: { key: 'admin-student-tracker' } },
    })

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState()
        const online = new Set<string>()
        const away = new Set<string>()
        const lastSeenMap = new Map<string, string>()

        Object.values(state).forEach((presences: any) => {
          presences.forEach((presence: PresenceEvent) => {
            if (presence.user_id && presence.role === 'student') {
              if (presence.status === 'online') {
                online.add(presence.user_id)
              } else if (presence.status === 'away') {
                away.add(presence.user_id)
              }
              if (presence.last_seen) {
                lastSeenMap.set(presence.user_id, presence.last_seen)
              }
            }
          })
        })

        setOnlineStudents(online)
        setAwayStudents(away)
        setStudentLastSeen(prev => new Map([...prev, ...lastSeenMap]))
        setIsConnected(true)
      })
      .subscribe()

    return () => {
      presenceChannel.unsubscribe()
      setIsConnected(false)
    }
  }, [students.length])

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
      return studentLastSeen.get(studentId) || ''
    },
    [studentLastSeen]
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