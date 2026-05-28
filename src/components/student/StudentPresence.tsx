// src/components/student/StudentPresence.tsx
'use client'

import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface StudentPresenceProps {
  userId: string
}

export function StudentPresence({ userId }: StudentPresenceProps) {
  const channelRef = useRef<any>(null)
  const heartbeatRef = useRef<NodeJS.Timeout>()
  const isUnloadingRef = useRef(false)

  useEffect(() => {
    if (!userId) return

    let mounted = true

    const setupPresence = async () => {
      try {
        // Create a presence channel
        const channel = supabase.channel('online-students')
        channelRef.current = channel

        // Handle when user closes tab
        const handleBeforeUnload = () => {
          isUnloadingRef.current = true
          if (channelRef.current && channelRef.current.track) {
            channelRef.current.track({
              user_id: userId,
              status: 'offline',
              last_seen: new Date().toISOString(),
            }).catch(console.error)
          }
        }

        window.addEventListener('beforeunload', handleBeforeUnload)

        // Handle page visibility (tab switch)
        const handleVisibilityChange = async () => {
          if (!channelRef.current || !mounted) return
          
          if (document.hidden) {
            // Tab hidden - mark as away
            await channelRef.current.track({
              user_id: userId,
              status: 'away',
              away_at: new Date().toISOString(),
              last_seen: new Date().toISOString(),
            })
          } else {
            // Tab visible - mark as online
            await channelRef.current.track({
              user_id: userId,
              status: 'online',
              online_at: new Date().toISOString(),
              last_seen: new Date().toISOString(),
              last_heartbeat: new Date().toISOString(),
            })
            resetHeartbeat()
          }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)

        // Send heartbeat every 30 seconds
        const resetHeartbeat = () => {
          if (heartbeatRef.current) {
            clearInterval(heartbeatRef.current)
          }
          
          heartbeatRef.current = setInterval(async () => {
            if (channelRef.current && mounted && !isUnloadingRef.current && !document.hidden) {
              await channelRef.current.track({
                user_id: userId,
                status: 'online',
                last_heartbeat: new Date().toISOString(),
                last_seen: new Date().toISOString(),
              }).catch(console.error)
            }
          }, 30000)
        }

        // Subscribe and track presence
        await channel.subscribe(async (status: string) => {
          if (status === 'SUBSCRIBED' && mounted && channelRef.current) {
            // Track initial presence
            await channelRef.current.track({
              user_id: userId,
              status: 'online',
              online_at: new Date().toISOString(),
              last_seen: new Date().toISOString(),
              last_heartbeat: new Date().toISOString(),
            })
            
            // Start heartbeat
            resetHeartbeat()
            
            console.log('✅ Presence tracking started for user:', userId)
          }
        })

        // Activity tracking: reset heartbeat on user interaction
        const handleUserActivity = () => {
          if (!document.hidden && channelRef.current && mounted && !isUnloadingRef.current) {
            resetHeartbeat()
          }
        }

        const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']
        activityEvents.forEach(event => {
          window.addEventListener(event, handleUserActivity)
        })

        // Cleanup
        return () => {
          mounted = false
          activityEvents.forEach(event => {
            window.removeEventListener(event, handleUserActivity)
          })
          window.removeEventListener('beforeunload', handleBeforeUnload)
          document.removeEventListener('visibilitychange', handleVisibilityChange)
          
          if (heartbeatRef.current) {
            clearInterval(heartbeatRef.current)
          }
          
          if (channelRef.current && !isUnloadingRef.current && channelRef.current.track) {
            channelRef.current.track({
              user_id: userId,
              status: 'offline',
              last_seen: new Date().toISOString(),
            }).finally(() => {
              channelRef.current?.unsubscribe()
            })
          } else {
            channelRef.current?.unsubscribe()
          }
        }
      } catch (error) {
        console.error('Error setting up presence:', error)
      }
    }

    setupPresence()

    return () => {
      mounted = false
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current)
      }
      if (channelRef.current) {
        channelRef.current.unsubscribe()
      }
    }
  }, [userId])

  return null
}

export default StudentPresence