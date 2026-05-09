// components/admin/students/hooks/useStudentPresence.ts - OPTIMIZED
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Student } from '../types'

type PresenceStatus = 'online' | 'away' | 'offline'

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
  const [lastSeenMap, setLastSeenMap] = useState<Map<string, string>>(new Map())
  const [isConnected, setIsConnected] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    
    if (!students.length) return

    const validStudentIds = new Set(students.map(s => s.id))

    const fetchStatus = async () => {
      try {
        // ✅ Add timeout to fetch
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 5000)

        const { data, error } = await supabase
          .from('user_online_status')
          .select('*')
          .abortSignal(controller.signal)

        clearTimeout(timeout)

        if (!mountedRef.current) return

        if (error) {
          // Silently ignore fetch errors
          return
        }

        const online = new Set<string>()
        const away = new Set<string>()
        const lastSeen = new Map<string, string>()

        data?.forEach((record: any) => {
          if (record.user_id && validStudentIds.has(record.user_id)) {
            if (record.is_online) {
              online.add(record.user_id)
            } else {
              away.add(record.user_id)
            }
            if (record.last_seen) {
              lastSeen.set(record.user_id, record.last_seen)
            }
          }
        })

        setOnlineStudents(online)
        setAwayStudents(away)
        setLastSeenMap(lastSeen)
        setIsConnected(true)
      } catch {
        // Silently ignore errors - component might be unmounted
      }
    }

    // Fetch immediately
    fetchStatus()

    // ✅ Poll every 30 seconds instead of 10 (reduces load)
    const interval = setInterval(fetchStatus, 30000)

    return () => {
      mountedRef.current = false
      clearInterval(interval)
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