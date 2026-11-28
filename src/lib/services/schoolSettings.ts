// src/lib/services/schoolSettings.ts
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface SchoolSettings {
  school_name?: string
  logo_path?: string
  school_phone?: string
  school_email?: string
  current_term?: string
  academic_session?: string
  [key: string]: any
}

// 1. In-memory cache singleton
let memoryCache: SchoolSettings | null = null
let inFlightPromise: Promise<SchoolSettings | null> | null = null

export async function getSchoolSettings(): Promise<SchoolSettings | null> {
  // A. Return memory cache immediately (0 ms, 0 bytes network egress)
  if (memoryCache) {
    return memoryCache
  }

  // B. Return sessionStorage cache if available (instant page loads)
  if (typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem('app_school_settings')
      if (stored) {
        memoryCache = JSON.parse(stored)
        return memoryCache
      }
    } catch {}
  }

  // C. Deduplicate simultaneous requests (if 5 components mount together, fire 1 query)
  if (inFlightPromise) {
    return inFlightPromise
  }

  inFlightPromise = (async () => {
    try {
      const supabase = createClient()
      // Fetch ONLY necessary display fields — NEVER select('*')
      const { data, error } = await supabase
        .from('school_settings')
        .select('school_name, logo_path, school_phone, school_email')
        .limit(1)
        .maybeSingle()

      if (error) {
        return memoryCache
      }

      if (data) {
        memoryCache = data
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem('app_school_settings', JSON.stringify(data))
          } catch {}
        }
      }
      return memoryCache
    } catch {
      return memoryCache
    } finally {
      inFlightPromise = null
    }
  })()

  return inFlightPromise
}

// React Hook for drop-in use in any Navbar, Header, or Login component
export function useSchoolSettings() {
  const [settings, setSettings] = useState<SchoolSettings | null>(memoryCache)
  const [loading, setLoading] = useState<boolean>(!memoryCache)

  useEffect(() => {
    let isMounted = true
    getSchoolSettings().then((data) => {
      if (isMounted && data) {
        setSettings(data)
        setLoading(false)
      }
    })
    return () => {
      isMounted = false
    }
  }, [])

  return { settings, loading }
}