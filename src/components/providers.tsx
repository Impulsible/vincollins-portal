'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, useEffect } from 'react'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'react-hot-toast'
import { usePathname } from 'next/navigation'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

// Configure NProgress
NProgress.configure({ 
  showSpinner: false,
  minimum: 0.2,
  speed: 400,
  easing: 'ease',
})

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
          },
          mutations: {
            retry: 1,
          },
        },
      })
  )

  const pathname = usePathname()

  // Handle route changes with NProgress
  useEffect(() => {
    NProgress.done()
  }, [pathname])

  // Optional: Handle offline status
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        
        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'hsl(var(--background))',
              color: 'hsl(var(--foreground))',
              borderRadius: 'var(--radius)',
              border: '1px solid hsl(var(--border))',
              fontSize: '14px',
              padding: '12px 16px',
            },
            success: {
              iconTheme: {
                primary: 'hsl(var(--success))',
                secondary: 'hsl(var(--success-foreground))',
              },
              style: {
                background: 'hsl(var(--success) / 0.1)',
                border: '1px solid hsl(var(--success))',
                color: 'hsl(var(--success))',
              },
            },
            error: {
              iconTheme: {
                primary: 'hsl(var(--destructive))',
                secondary: 'hsl(var(--destructive-foreground))',
              },
              style: {
                background: 'hsl(var(--destructive) / 0.1)',
                border: '1px solid hsl(var(--destructive))',
                color: 'hsl(var(--destructive))',
              },
            },
            loading: {
              style: {
                background: 'hsl(var(--muted))',
                color: 'hsl(var(--muted-foreground))',
              },
            },
          }}
        />

        {/* React Query Devtools (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
        )}

        {/* Offline Indicator */}
        {!isOnline && (
          <div className="fixed bottom-4 right-4 z-50 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg shadow-lg text-sm animate-in slide-in-from-right-5">
            You are offline. Some features may be unavailable.
          </div>
        )}
      </ThemeProvider>
    </QueryClientProvider>
  )
}