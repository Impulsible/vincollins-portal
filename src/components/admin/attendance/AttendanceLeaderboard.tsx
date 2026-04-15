/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// components/admin/attendance/AttendanceLeaderboard.tsx
'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Trophy, Users, TrendingUp, Activity, Wifi, WifiOff, CircleDot } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

interface Student {
  id: string
  full_name: string
  class: string
  photo_url?: string
}

interface AttendanceLeaderboardProps {
  students: Student[]
}

interface PresenceEvent {
  user_id: string
  status?: 'online' | 'away'
  last_seen?: string
  role?: string
  [key: string]: any
}

export function AttendanceLeaderboard({ students }: AttendanceLeaderboardProps) {
  const [onlineStudents, setOnlineStudents] = useState<Set<string>>(new Set())
  const [awayStudents, setAwayStudents] = useState<Set<string>>(new Set())
  const [studentLastSeen, setStudentLastSeen] = useState<Map<string, string>>(new Map())
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!students.length) return

    let presenceChannel: any = null

    const setupPresenceTracking = async () => {
      try {
        presenceChannel = supabase.channel('online-students-attendance', {
          config: {
            presence: {
              key: 'attendance-tracker',
            },
          },
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
                  } else {
                    online.add(presence.user_id)
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
          .on('presence', { event: 'join' }, ({ newPresences }: { newPresences: PresenceEvent[] }) => {
            setOnlineStudents(prev => {
              const newSet = new Set(prev)
              newPresences.forEach((p: PresenceEvent) => {
                if (p.user_id && p.role === 'student' && p.status !== 'away') {
                  newSet.add(p.user_id)
                }
              })
              return newSet
            })
            setAwayStudents(prev => {
              const newSet = new Set(prev)
              newPresences.forEach((p: PresenceEvent) => {
                if (p.user_id && p.role === 'student' && p.status === 'away') {
                  newSet.add(p.user_id)
                }
              })
              return newSet
            })
          })
          .on('presence', { event: 'leave' }, ({ leftPresences }: { leftPresences: PresenceEvent[] }) => {
            setOnlineStudents(prev => {
              const newSet = new Set(prev)
              leftPresences.forEach((p: PresenceEvent) => {
                if (p.user_id && p.role === 'student') {
                  newSet.delete(p.user_id)
                }
              })
              return newSet
            })
            setAwayStudents(prev => {
              const newSet = new Set(prev)
              leftPresences.forEach((p: PresenceEvent) => {
                if (p.user_id && p.role === 'student') newSet.delete(p.user_id)
              })
              return newSet
            })
          })

        await presenceChannel.subscribe()
      } catch (error) {
        console.error('Error setting up presence tracking:', error)
      }
    }

    setupPresenceTracking()

    return () => {
      if (presenceChannel) {
        presenceChannel.unsubscribe()
      }
    }
  }, [students.length])

  const attendanceData = useMemo(() => {
    return students
      .map(student => {
        const isOnline = onlineStudents.has(student.id)
        const isAway = awayStudents.has(student.id)
        const status = isOnline ? 'online' : isAway ? 'away' : 'offline'
        
        let attendanceScore = 0
        if (isOnline) attendanceScore = 100
        else if (isAway) attendanceScore = 70
        
        return {
          ...student,
          status,
          attendanceScore,
          lastSeen: studentLastSeen.get(student.id),
        }
      })
      .sort((a, b) => {
        if (a.status === 'online' && b.status !== 'online') return -1
        if (a.status !== 'online' && b.status === 'online') return 1
        if (a.status === 'away' && b.status === 'offline') return -1
        if (a.status === 'offline' && b.status === 'away') return 1
        return b.attendanceScore - a.attendanceScore
      })
      .slice(0, 10)
  }, [students, onlineStudents, awayStudents, studentLastSeen])

  const onlineCount = onlineStudents.size
  const totalCount = students.length
  const attendanceRate = totalCount > 0 ? Math.round((onlineCount / totalCount) * 100) : 0

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <Wifi className="h-4 w-4 text-emerald-500" />
      case 'away':
        return <CircleDot className="h-4 w-4 text-amber-500" />
      default:
        return <WifiOff className="h-4 w-4 text-slate-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30'
      case 'away':
        return 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30'
      default:
        return 'text-slate-600 bg-slate-50 dark:text-slate-400 dark:bg-slate-800'
    }
  }

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-secondary">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Real-Time Attendance Leaderboard</CardTitle>
              <p className="text-sm text-muted-foreground">
                Live student presence tracking
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-primary">{onlineCount}</span>
                <span className="text-sm text-muted-foreground">/ {totalCount}</span>
              </div>
              <p className="text-xs text-muted-foreground">Students Online</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <span className="text-lg font-bold text-white">{attendanceRate}%</span>
            </div>
          </div>
        </div>
        <Progress value={attendanceRate} className="mt-4 h-2" />
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {attendanceData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No student data available</p>
            </div>
          ) : (
            attendanceData.map((student, index) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors",
                  index === 0 && student.status === 'online' && "bg-gradient-to-r from-amber-50/50 to-transparent"
                )}
              >
                {/* Rank */}
                <div className="w-8 text-center">
                  {index === 0 && student.status === 'online' ? (
                    <Trophy className="h-5 w-5 text-amber-500 mx-auto" />
                  ) : (
                    <span className={cn(
                      "text-sm font-bold",
                      index < 3 ? "text-primary" : "text-muted-foreground"
                    )}>
                      #{index + 1}
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <Avatar className="h-10 w-10 ring-2 ring-background">
                  <AvatarImage src={student.photo_url} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20">
                    {student.full_name?.charAt(0) || 'S'}
                  </AvatarFallback>
                </Avatar>

                {/* Student Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{student.full_name}</p>
                    {getStatusIcon(student.status)}
                  </div>
                  <p className="text-xs text-muted-foreground">{student.class}</p>
                </div>

                {/* Status Badge */}
                <Badge className={cn("capitalize", getStatusColor(student.status))}>
                  {student.status}
                </Badge>

                {/* Progress Bar */}
                <div className="hidden md:block w-24">
                  <Progress value={student.attendanceScore} className="h-1.5" />
                </div>
              </motion.div>
            ))
          )}
        </div>

        {isConnected && (
          <div className="border-t p-3 bg-muted/20">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Live tracking active</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Wifi className="h-3 w-3 text-emerald-500" /> Online
                </span>
                <span className="flex items-center gap-1">
                  <CircleDot className="h-3 w-3 text-amber-500" /> Away
                </span>
                <span className="flex items-center gap-1">
                  <WifiOff className="h-3 w-3 text-slate-400" /> Offline
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}