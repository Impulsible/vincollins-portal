/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useAdminData.ts
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { cache, CACHE_KEYS } from '@/lib/cache'
import { toast } from 'sonner'

interface UseAdminDataOptions {
  enabled?: boolean
  ttl?: number
  onError?: (error: Error) => void
}

export function useAdminData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseAdminDataOptions = {}
) {
  const { enabled = true, ttl = 5 * 60 * 1000, onError } = options
  
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const isMounted = useRef(true)
  const abortController = useRef<AbortController | null>(null)

  const loadData = useCallback(async (forceRefresh = false) => {
    if (!enabled) return
    
    // Check cache first
    if (!forceRefresh) {
      const cachedData = cache.get<T>(key)
      if (cachedData) {
        setData(cachedData)
        setIsLoading(false)
        // Still fetch in background for updates
        setTimeout(() => loadData(true), 100)
        return
      }
    }
    
    // Cancel previous request
    if (abortController.current) {
      abortController.current.abort()
    }
    
    abortController.current = new AbortController()
    
    try {
      const result = await fetcher()
      
      if (isMounted.current) {
        setData(result)
        cache.set(key, result, ttl)
        setError(null)
      }
    } catch (err: any) {
      if (err.name !== 'AbortError' && isMounted.current) {
        setError(err)
        onError?.(err)
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    }
  }, [key, fetcher, enabled, ttl, onError])

  const refresh = useCallback(() => {
    setIsRefreshing(true)
    loadData(true)
  }, [loadData])

  useEffect(() => {
    isMounted.current = true
    loadData(false)
    
    return () => {
      isMounted.current = false
      if (abortController.current) {
        abortController.current.abort()
      }
    }
  }, [loadData])

  return { data, isLoading, isRefreshing, error, refresh }
}