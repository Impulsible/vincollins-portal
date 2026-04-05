/* eslint-disable @typescript-eslint/no-explicit-any */
// components/student/StudentPresence.tsx
'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function StudentPresence({ userId }: { userId: string }) {
  useEffect(() => {
    let channel: any = null

    const setupPresence = async () => {
      try {
        // Create a presence channel
        channel = supabase.channel('online-students', {
          config: {
            presence: {
              key: userId,
            },
          },
        })

        // Set up presence tracking
        channel.on('presence', { event: 'sync' }, () => {
          console.log('Presence synced')
        })

        // Subscribe and set presence state
        await channel.subscribe(async (status: string) => {
          if (status === 'SUBSCRIBED') {
            // Track when user is active
            await channel.track({
              user_id: userId,
              status: 'online',
              online_at: new Date().toISOString(),
            })

            // Set up activity tracking
            let activityTimeout: NodeJS.Timeout
            let isAway = false

            const resetActivity = async () => {
              if (isAway) {
                isAway = false
                await channel.track({
                  user_id: userId,
                  status: 'online',
                  online_at: new Date().toISOString(),
                })
              }
              clearTimeout(activityTimeout)
              activityTimeout = setTimeout(async () => {
                isAway = true
                await channel.track({
                  user_id: userId,
                  status: 'away',
                  away_at: new Date().toISOString(),
                })
              }, 5 * 60 * 1000) // 5 minutes of inactivity
            }

            // Track user activity
            window.addEventListener('mousemove', resetActivity)
            window.addEventListener('keydown', resetActivity)
            window.addEventListener('click', resetActivity)
            window.addEventListener('scroll', resetActivity)

            // Initial activity tracker
            resetActivity()

            // Clean up on page unload
            window.addEventListener('beforeunload', async () => {
              await channel.track({
                user_id: userId,
                status: 'offline',
              })
              channel.unsubscribe()
            })

            return () => {
              window.removeEventListener('mousemove', resetActivity)
              window.removeEventListener('keydown', resetActivity)
              window.removeEventListener('click', resetActivity)
              window.removeEventListener('scroll', resetActivity)
              clearTimeout(activityTimeout)
            }
          }
        })
      } catch (error) {
        console.error('Error setting up presence:', error)
      }
    }

    if (userId) {
      setupPresence()
    }

    return () => {
      if (channel) {
        channel.unsubscribe()
      }
    }
  }, [userId])

  return null
}