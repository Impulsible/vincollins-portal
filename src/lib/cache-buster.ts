// lib/cache-buster.ts - COMPLETE CACHE BUSTING UTILITIES
'use client'

export const bustCache = () => {
  if (typeof window === 'undefined') return
  
  // Add timestamp to all fetch requests
  const originalFetch = window.fetch
  window.fetch = function(url: RequestInfo | URL, options: RequestInit = {}) {
    const urlString = typeof url === 'string' ? url : url.toString()
    
    // Skip cache busting for static assets and same-origin fonts/images
    const skipPatterns = [
      '/_next/static',
      '/fonts/',
      '/images/',
      'fonts.googleapis.com',
      'fonts.gstatic.com'
    ]
    
    const shouldSkip = skipPatterns.some(pattern => urlString.includes(pattern))
    
    if (!shouldSkip && !urlString.includes('_t=')) {
      const separator = urlString.includes('?') ? '&' : '?'
      const timestamp = `_t=${Date.now()}`
      const bustedUrl = `${urlString}${separator}${timestamp}`
      return originalFetch.call(this, bustedUrl, options)
    }
    
    return originalFetch.call(this, url, options)
  }
}

export const clearExpiredCache = () => {
  if (typeof window === 'undefined') return
  
  const keysToKeep = [
    'user_profile', 
    'auth_user', 
    'auth_role',
    'lastCacheClear',
    'portalCacheClear',
    'student_dashboard_cache',
    'staff_dashboard_cache',
    'admin_dashboard_cache',
    'school_settings',
    'versionBannerSeen'
  ]
  
  const now = Date.now()
  const lastClear = localStorage.getItem('lastCacheClear')
  
  // Clear cache once per day
  if (!lastClear || now - parseInt(lastClear) > 24 * 60 * 60 * 1000) {
    const allKeys = Object.keys(localStorage)
    let clearedCount = 0
    
    allKeys.forEach(key => {
      if (!keysToKeep.includes(key) && !key.startsWith('sb-') && !key.startsWith('supabase')) {
        localStorage.removeItem(key)
        clearedCount++
      }
    })
    
    // Clear session storage except auth-related
    const sessionKeys = Object.keys(sessionStorage)
    sessionKeys.forEach(key => {
      if (!key.startsWith('supabase') && !key.startsWith('sb-')) {
        sessionStorage.removeItem(key)
      }
    })
    
    localStorage.setItem('lastCacheClear', now.toString())
    console.log(`Cache cleared: ${clearedCount} items removed`)
  }
}

export const getVersion = () => {
  return {
    version: process.env.NEXT_PUBLIC_APP_VERSION || '2.0.0',
    timestamp: new Date().toISOString(),
    buildId: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'dev'
  }
}

export const forceRefresh = () => {
  if (typeof window === 'undefined') return
  
  // Clear all storage
  localStorage.clear()
  sessionStorage.clear()
  
  // Hard reload with cache bust
  window.location.href = window.location.href.split('?')[0] + '?_t=' + Date.now()
}