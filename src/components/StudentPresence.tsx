// src/components/StudentPresence.tsx
'use client'

import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/contexts/UserContext'

export function StudentPresenceTracker() {
  const { user, isAuthenticated } = useUser()
  const intervalRef = useRef<NodeJS.Timeout>()
  const isTrackingRef = useRef(false)

  useEffect(() => {
    if (!user?.id || !isAuthenticated) {
      console.log('❌ Cannot track presence: No authenticated user')
      return
    }

    const updatePresence = async () => {
      if (isTrackingRef.current) return
      
      try {
        isTrackingRef.current = true
        
        const { error } = await supabase
          .from('student_presence')
          .upsert(
            {
              student_id: user.id,
              last_seen: new Date().toISOString(),
              is_online: true,
            },
            { onConflict: 'student_id' }
          )

        if (error) {
          if (error.code === '401' || error.message.includes('Unauthorized')) {
            console.warn('⚠️ Unauthorized to update presence - may need to re-login')
            // Optionally trigger a session refresh
            // await supabase.auth.refreshSession()
          } else {
            console.error('Presence update error:', error)
          }
        }
      } catch (err) {
        console.error('Presence update failed:', err)
      } finally {
        isTrackingRef.current = false
      }
    }

    // Update presence immediately
    updatePresence()

    // Update every 30 seconds
    intervalRef.current = setInterval(updatePresence, 30000)

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      
      // Mark as offline on unmount
      if (user?.id) {
        supabase
          .from('student_presence')
          .upsert(
            {
              student_id: user.id,
              last_seen: new Date().toISOString(),
              is_online: false,
            },
            { onConflict: 'student_id' }
          )
          .then(({ error }) => {
            if (error) console.error('Error marking offline:', error)
          })
      }
    }
  }, [user?.id, isAuthenticated])

  return null // This component doesn't render anything
}