/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/cache.ts
'use client'

interface CacheItem<T> {
  data: T
  timestamp: number
  expiresAt: number
}

class CacheService {
  private static instance: CacheService
  private defaultTTL = 5 * 60 * 1000 // 5 minutes

  private constructor() {}

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService()
    }
    return CacheService.instance
  }

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    if (typeof window === 'undefined') return
    
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl
    }
    
    try {
      localStorage.setItem(key, JSON.stringify(item))
    } catch (error) {
      console.error('Failed to set cache:', error)
    }
  }

  get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null
    
    try {
      const itemStr = localStorage.getItem(key)
      if (!itemStr) return null
      
      const item: CacheItem<T> = JSON.parse(itemStr)
      
      if (Date.now() > item.expiresAt) {
        localStorage.removeItem(key)
        return null
      }
      
      return item.data
    } catch (error) {
      console.error('Failed to get cache:', error)
      return null
    }
  }

  remove(key: string): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(key)
  }

  clear(): void {
    if (typeof window === 'undefined') return
    localStorage.clear()
  }

  has(key: string): boolean {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(key) !== null && !this.isExpired(key)
  }

  isExpired(key: string): boolean {
    if (typeof window === 'undefined') return true
    
    const itemStr = localStorage.getItem(key)
    if (!itemStr) return true
    
    try {
      const item: CacheItem<any> = JSON.parse(itemStr)
      return Date.now() > item.expiresAt
    } catch {
      return true
    }
  }
}

export const cache = CacheService.getInstance()

// Cache keys
export const CACHE_KEYS = {
  STUDENTS: 'admin_students',
  STAFF: 'admin_staff',
  STATS: 'admin_stats',
  EXAMS: 'admin_exams',
  SUBMISSIONS: 'admin_submissions',
  NOTIFICATIONS: 'admin_notifications',
  PROFILE: 'admin_profile',
  SCHOOL_SETTINGS: 'school_settings',
}