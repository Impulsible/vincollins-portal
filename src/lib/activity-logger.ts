// lib/activity-logger.ts
import { supabase } from '@/lib/supabase'

export async function logActivity(
  type: string,
  title: string,
  details: string,
  metadata?: Record<string, any>
) {
  try {
    await supabase.from('activity_logs').insert({
      type,
      title,
      details,
      metadata: metadata || {},
      created_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to log activity:', error)
  }
}