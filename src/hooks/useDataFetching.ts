// src/hooks/useDataFetching.ts - FIXED GENERIC TYPE
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface FetchOptions<T> {
  key: string
  fetcher: () => Promise<T>
  cacheDuration?: number
  enabled?: boolean
}

const cache = new Map<string, { data: any; timestamp: number }>()

export function useDataFetching<T>({ 
  key, 
  fetcher, 
  cacheDuration = 30000, 
  enabled = true 
}: FetchOptions<T>) {
  const [data, setData] = useState<T | null>(() => {
    const cached = cache.get(key)
    if (cached && Date.now() - cached.timestamp < cacheDuration) {
      return cached.data as T
    }
    return null
  })
  
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)
  const inFlightRef = useRef<Promise<T> | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const fetchData = useCallback(async (skipCache = false): Promise<T | null> => {
    if (!skipCache) {
      const cached = cache.get(key)
      if (cached && Date.now() - cached.timestamp < cacheDuration) {
        if (mountedRef.current) {
          setData(cached.data as T)
          setLoading(false)
        }
        return cached.data as T
      }
    }

    if (inFlightRef.current) {
      return inFlightRef.current
    }

    if (mountedRef.current) {
      setLoading(true)
      setError(null)
    }

    const promise = fetcher()
      .then((result) => {
        cache.set(key, { data: result, timestamp: Date.now() })
        if (mountedRef.current) {
          setData(result)
          setLoading(false)
        }
        return result
      })
      .catch((err) => {
        if (mountedRef.current) {
          setError(err instanceof Error ? err : new Error(String(err)))
          setLoading(false)
        }
        throw err
      })
      .finally(() => {
        inFlightRef.current = null
      })

    inFlightRef.current = promise
    return promise
  }, [key, fetcher, cacheDuration])

  useEffect(() => {
    if (enabled) {
      fetchData()
    }
  }, [enabled, fetchData])

  const clearCache = useCallback(() => {
    cache.delete(key)
  }, [key])

  const invalidate = useCallback(async () => {
    cache.delete(key)
    return fetchData(true)
  }, [key, fetchData])

  return { 
    data, 
    loading, 
    error, 
    refetch: () => fetchData(true),
    refresh: () => fetchData(false),
    clearCache,
    invalidate
  }
}

export function clearAllCache() {
  cache.clear()
}

export function clearCacheByPrefix(prefix: string) {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key)
    }
  }
}