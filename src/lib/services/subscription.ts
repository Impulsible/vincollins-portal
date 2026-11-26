'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

let cachedSub: any = null
let subPromise: Promise<any> | null = null
let lastFetch = 0
const SUB_TTL = 15 * 60 * 1000 // 15 minutes cache

export async function getSubscriptionStatus(): Promise<any> {
  const now = Date.now()
  if (cachedSub && (now - lastFetch < SUB_TTL)) {
    return cachedSub
  }

  if (typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem('app_subscription')
      if (stored) {
        cachedSub = JSON.parse(stored)
        return cachedSub
      }
    } catch {}
  }

  if (subPromise) return subPromise

  subPromise = (async () => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.id) return null

      const { data, error } = await supabase
        .from('subscription')
        .select('id, status, plan, expires_at')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (!error && data) {
        cachedSub = data
        lastFetch = Date.now()
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem('app_subscription', JSON.stringify(data))
          } catch {}
        }
      }
      return cachedSub
    } catch {
      return cachedSub
    } finally {
      subPromise = null
    }
  })()

  return subPromise
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<any>(cachedSub)
  const [loading, setLoading] = useState<boolean>(!cachedSub)

  useEffect(() => {
    let isMounted = true
    getSubscriptionStatus().then((sub) => {
      if (isMounted) {
        setSubscription(sub)
        setLoading(false)
      }
    })
    return () => {
      isMounted = false
    }
  }, [])

  return { subscription, loading }
}