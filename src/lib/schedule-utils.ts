// src/lib/schedule-utils.ts - Utility functions for schedule
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function createRouteHandlerClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookie = await cookieStore.get(name)
          return cookie?.value
        },
        async set(name: string, value: string, options: any) {
          await cookieStore.set({ name, value, ...options })
        },
        async remove(name: string, options: any) {
          await cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

// ✅ Moved here from the route file
export async function getScheduleByDateRange(
  dateFrom: string, 
  dateTo: string, 
  classParam?: string
) {
  const supabase = await createRouteHandlerClient()
  
  let query = supabase
    .from('schedules')
    .select('*')
    .gte('start_time', dateFrom)
    .lte('end_time', dateTo)
    .order('start_time', { ascending: true })
  
  if (classParam) query = query.eq('class', classParam)
  
  const { data, error } = await query
  if (error) throw error
  return data
}