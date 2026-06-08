// src/hooks/useDataFetching.ts - UPDATED WITH RETRY LOGIC & BETTER CACHING
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface FetchOptions<T> {
  key: string
  fetcher: () => Promise<T>
  cacheDuration?: number
  enabled?: boolean
  retryCount?: number
  retryDelay?: number
  onError?: (error: Error) => void
  onSuccess?: (data: T) => void
  staleWhileRevalidate?: boolean
}

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
  etag?: string
}

// Enhanced cache with expiration
const cache = new Map<string, CacheEntry<any>>()

// Cache configuration
const DEFAULT_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const MAX_RETRY_COUNT = 3
const BASE_RETRY_DELAY = 1000 // 1 second

export function useDataFetching<T>({ 
  key, 
  fetcher, 
  cacheDuration = DEFAULT_CACHE_DURATION, 
  enabled = true,
  retryCount = MAX_RETRY_COUNT,
  retryDelay = BASE_RETRY_DELAY,
  onError,
  onSuccess,
  staleWhileRevalidate = true
}: FetchOptions<T>) {
  const [data, setData] = useState<T | null>(() => {
    const cached = cache.get(key)
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data
    }
    // Stale data while revalidating
    if (staleWhileRevalidate && cached && Date.now() >= cached.expiresAt) {
      return cached.data
    }
    return null
  })
  
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)
  const [isStale, setIsStale] = useState<boolean>(false)
  const inFlightRef = useRef<Promise<T> | null>(null)
  const mountedRef = useRef(true)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    mountedRef.current = true
    return () => { 
      mountedRef.current = false
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Check cache validity
  const isCacheValid = useCallback((cached: CacheEntry<T>): boolean => {
    return Date.now() < cached.expiresAt
  }, [])

  // Get cached data
  const getCachedData = useCallback((): { data: T | null; isValid: boolean } => {
    const cached = cache.get(key)
    if (!cached) return { data: null, isValid: false }
    
    const isValid = isCacheValid(cached)
    return { data: cached.data, isValid }
  }, [key, isCacheValid])

  // Update cache with exponential backoff for retries
  const updateCache = useCallback((result: T, etag?: string) => {
    cache.set(key, {
      data: result,
      timestamp: Date.now(),
      expiresAt: Date.now() + cacheDuration,
      etag
    })
  }, [key, cacheDuration])

  // Fetch with retry logic
  const fetchWithRetry = useCallback(async (attempt = 1): Promise<T> => {
    try {
      // Create abort controller for timeout
      abortControllerRef.current = new AbortController()
      const timeoutId = setTimeout(() => {
        abortControllerRef.current?.abort()
      }, 30000) // 30 second timeout

      const result = await fetcher()
      clearTimeout(timeoutId)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      
      // Don't retry on abort
      if (error.name === 'AbortError') {
        throw new Error('Request timeout')
      }
      
      // Retry logic
      if (attempt <= retryCount) {
        const delay = retryDelay * Math.pow(2, attempt - 1) // Exponential backoff
        console.log(`Retry attempt ${attempt} for ${key} in ${delay}ms`)
        
        await new Promise(resolve => {
          retryTimeoutRef.current = setTimeout(resolve, delay)
        })
        
        return fetchWithRetry(attempt + 1)
      }
      
      throw error
    }
  }, [fetcher, retryCount, retryDelay, key])

  const fetchData = useCallback(async (skipCache = false, forceRefresh = false): Promise<T | null> => {
    // Check cache first
    if (!skipCache && !forceRefresh) {
      const { data: cachedData, isValid } = getCachedData()
      
      if (isValid && cachedData !== null) {
        if (mountedRef.current) {
          setData(cachedData)
          setLoading(false)
          setError(null)
          setIsStale(false)
        }
        return cachedData
      }
      
      // Stale data while revalidating
      if (staleWhileRevalidate && cachedData !== null) {
        if (mountedRef.current) {
          setData(cachedData)
          setIsStale(true)
        }
        // Continue to fetch fresh data in background
      }
    }

    // Prevent duplicate in-flight requests
    if (inFlightRef.current) {
      return inFlightRef.current
    }

    if (mountedRef.current) {
      setLoading(true)
      setError(null)
    }

    const promise = fetchWithRetry()
      .then((result) => {
        updateCache(result)
        if (mountedRef.current) {
          setData(result)
          setLoading(false)
          setIsStale(false)
          onSuccess?.(result)
        }
        return result
      })
      .catch((err) => {
        const error = err instanceof Error ? err : new Error(String(err))
        if (mountedRef.current) {
          setError(error)
          setLoading(false)
          onError?.(error)
        }
        console.error(`Fetch error for key ${key}:`, error.message)
        throw error
      })
      .finally(() => {
        inFlightRef.current = null
      })

    inFlightRef.current = promise
    return promise
  }, [key, getCachedData, fetchWithRetry, updateCache, staleWhileRevalidate, onSuccess, onError])

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchData()
    }
  }, [enabled, fetchData])

  // Clear cache for this key
  const clearCache = useCallback(() => {
    cache.delete(key)
    if (mountedRef.current) {
      setData(null)
      setError(null)
      setIsStale(false)
    }
  }, [key])

  // Invalidate and refetch
  const invalidate = useCallback(async () => {
    cache.delete(key)
    return fetchData(true, true)
  }, [key, fetchData])

  // Manual refetch
  const refetch = useCallback(() => {
    return fetchData(true, true)
  }, [fetchData])

  // Refresh with cache check
  const refresh = useCallback(() => {
    return fetchData(false, false)
  }, [fetchData])

  // Prefetch data
  const prefetch = useCallback(async () => {
    if (!enabled) return
    try {
      const result = await fetchWithRetry()
      updateCache(result)
      return result
    } catch (error) {
      console.error(`Prefetch error for ${key}:`, error)
      return null
    }
  }, [fetchWithRetry, updateCache, key, enabled])

  return { 
    data, 
    loading, 
    error, 
    isStale,
    refetch,
    refresh,
    clearCache,
    invalidate,
    prefetch,
    isCached: cache.has(key)
  }
}

// Clear all cache
export function clearAllCache() {
  cache.clear()
}

// Clear cache by prefix
export function clearCacheByPrefix(prefix: string) {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key)
    }
  }
}

// Clear expired cache entries
export function clearExpiredCache() {
  const now = Date.now()
  for (const [key, entry] of cache.entries()) {
    if (now >= entry.expiresAt) {
      cache.delete(key)
    }
  }
}

// Get cache stats
export function getCacheStats() {
  const now = Date.now()
  let valid = 0
  let expired = 0
  
  for (const entry of cache.values()) {
    if (now < entry.expiresAt) {
      valid++
    } else {
      expired++
    }
  }
  
  return {
    total: cache.size,
    valid,
    expired,
    keys: Array.from(cache.keys())
  }
}

// Set up periodic cache cleanup (every 5 minutes)
if (typeof window !== 'undefined') {
  setInterval(() => {
    clearExpiredCache()
  }, 5 * 60 * 1000)
}