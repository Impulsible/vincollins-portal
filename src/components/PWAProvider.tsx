// src/components/PWAProvider.tsx - UPDATED WITH DEV MODE CHECK

'use client'

import {
  useState, useEffect, useCallback, useRef, createContext, useContext,
} from 'react'
import { RefreshCw, Download, X, Wifi, WifiOff, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Context ───────────────────────────────────────────────────────────────────
interface PWAContextValue {
  isInstalled: boolean
  isOnline: boolean
  canInstall: boolean
  promptInstall: () => void
  reload: () => void
}

const PWAContext = createContext<PWAContextValue>({
  isInstalled: false,
  isOnline: true,
  canInstall: false,
  promptInstall: () => {},
  reload: () => {},
})

export const usePWA = () => useContext(PWAContext)

// ── Types ─────────────────────────────────────────────────────────────────────
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// ── Reload Button (always visible when installed) ────────────────────────────
function PWAReloadButton({ onClick }: { onClick: () => void }) {
  const [spinning, setSpinning] = useState(false)

  const handleClick = () => {
    setSpinning(true)
    setTimeout(() => onClick(), 300)
  }

  return (
    <button
      onClick={handleClick}
      aria-label="Reload app"
      className={cn(
        'fixed bottom-[5.5rem] right-4 z-50',
        'lg:bottom-6 lg:right-6',
        'w-12 h-12 rounded-full',
        'bg-[#0A2472] text-white',
        'shadow-lg shadow-[#0A2472]/30',
        'flex items-center justify-center',
        'transition-all duration-200',
        'hover:bg-[#1e3a8a] hover:scale-110 hover:shadow-xl',
        'active:scale-95',
        'border-2 border-white/20',
      )}
    >
      <RefreshCw className={cn('h-5 w-5', spinning && 'animate-spin')} />
    </button>
  )
}

// ── Update Toast ──────────────────────────────────────────────────────────────
function UpdateToast({
  onUpdate,
  onDismiss,
}: {
  onUpdate: () => void
  onDismiss: () => void
}) {
  return (
    <div className={cn(
      'fixed top-4 left-1/2 -translate-x-1/2 z-[9999]',
      'w-[calc(100vw-2rem)] max-w-sm',
      'bg-[#0A2472] text-white',
      'rounded-2xl shadow-2xl shadow-[#0A2472]/40',
      'border border-white/20',
      'p-4',
      'flex items-center gap-3',
      'animate-in slide-in-from-top-4 duration-300',
    )}>
      <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
        <RefreshCw className="h-4 w-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">Update Available</p>
        <p className="text-xs text-white/70 mt-0.5">
          A new version of the portal is ready
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onUpdate}
          className="px-3 py-1.5 bg-white text-[#0A2472] rounded-lg text-xs font-semibold hover:bg-white/90 transition-colors"
        >
          Update
        </button>
        <button
          onClick={onDismiss}
          className="p-1 text-white/60 hover:text-white transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// ── Offline Banner ────────────────────────────────────────────────────────────
function OfflineBanner() {
  return (
    <div className={cn(
      'fixed top-0 left-0 right-0 z-[9998]',
      'bg-red-600 text-white',
      'px-4 py-2',
      'flex items-center justify-center gap-2',
      'text-sm font-medium',
      'animate-in slide-in-from-top-2 duration-300',
    )}>
      <WifiOff className="h-4 w-4 flex-shrink-0" />
      <span>You're offline — some features may not be available</span>
    </div>
  )
}

// ── Online Toast (brief) ──────────────────────────────────────────────────────
function OnlineToast({ onDismiss }: { onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div className={cn(
      'fixed top-4 left-1/2 -translate-x-1/2 z-[9998]',
      'bg-emerald-600 text-white',
      'rounded-full shadow-lg',
      'px-4 py-2',
      'flex items-center gap-2',
      'text-sm font-medium',
      'animate-in slide-in-from-top-2 duration-300',
    )}>
      <Wifi className="h-4 w-4" />
      <span>Back online</span>
      <CheckCircle className="h-4 w-4" />
    </div>
  )
}

// ── Install Banner ────────────────────────────────────────────────────────────
function InstallBanner({
  onInstall,
  onDismiss,
}: {
  onInstall: () => void
  onDismiss: () => void
}) {
  return (
    <div className={cn(
      'fixed bottom-[5rem] left-3 right-3 z-50',
      'lg:bottom-6 lg:left-auto lg:right-6 lg:w-80',
      'bg-[#0A2472] text-white',
      'rounded-2xl shadow-2xl shadow-[#0A2472]/40',
      'border border-white/20',
      'p-4',
      'animate-in slide-in-from-bottom-4 duration-300',
    )}>
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 p-1 text-white/50 hover:text-white transition-colors"
        aria-label="Dismiss install prompt"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3">
        {/* App Icon */}
        <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0 text-2xl">
          🎓
        </div>

        <div className="flex-1 min-w-0 pr-4">
          <p className="font-bold text-sm">Install Vincollins Portal</p>
          <p className="text-xs text-white/70 mt-0.5 leading-relaxed">
            Add to your home screen for faster access and offline support
          </p>

          <div className="flex gap-2 mt-3">
            <button
              onClick={onInstall}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5',
                'bg-white text-[#0A2472]',
                'rounded-xl py-2 px-3',
                'text-xs font-semibold',
                'hover:bg-white/90 transition-colors',
              )}
            >
              <Download className="h-3.5 w-3.5" />
              Install App
            </button>
            <button
              onClick={onDismiss}
              className="px-3 py-2 text-xs text-white/60 hover:text-white transition-colors rounded-xl hover:bg-white/10"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Provider ─────────────────────────────────────────────────────────────
export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [isInstalled, setIsInstalled] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [showOffline, setShowOffline] = useState(false)
  const [showOnlineToast, setShowOnlineToast] = useState(false)
  const [showUpdate, setShowUpdate] = useState(false)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null)

  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null)
  const installDismissedRef = useRef(false)

  // ✅ Check if in development mode
  const isDev = process.env.NODE_ENV === 'development'

  // ── Detect installed (standalone) mode ─────────────────────────────────────
  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true

    setIsInstalled(isStandalone)
    setIsOnline(navigator.onLine)
    if (!navigator.onLine) setShowOffline(true)
  }, [])

  // ── Register Service Worker (SKIP IN DEVELOPMENT) ──────────────────────────
  useEffect(() => {
    // ✅ Skip service worker registration in development mode
    if (isDev) {
      console.log('[PWA] ⚠️ Service worker disabled in development mode')
      return
    }

    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        })

        setSwRegistration(reg)
        console.log('[PWA] Service worker registered')

        // Check for update
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (!newWorker) return

          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // New SW installed, old one still controlling
              setShowUpdate(true)
            }
          })
        })

        // Periodic update check
        setInterval(() => reg.update(), 60 * 60 * 1000) // every hour
      } catch (err) {
        console.warn('[PWA] Service worker registration failed:', err)
      }
    }

    register()

    // Listen for controller change (after update)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // SW took control after update — reload is optional here
    })
  }, [isDev])

  // ── Online / Offline ────────────────────────────────────────────────────────
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowOffline(false)
      setShowOnlineToast(true)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowOffline(true)
      setShowOnlineToast(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // ── Install Prompt ──────────────────────────────────────────────────────────
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      deferredPromptRef.current = e as BeforeInstallPromptEvent

      // Only show after 30s, and only if not dismissed before
      const dismissed = localStorage.getItem('pwa-install-dismissed')
      const lastDismissed = dismissed ? parseInt(dismissed) : 0
      const oneWeek = 7 * 24 * 60 * 60 * 1000

      if (!installDismissedRef.current && Date.now() - lastDismissed > oneWeek) {
        setTimeout(() => {
          if (deferredPromptRef.current) setShowInstallBanner(true)
        }, 30000)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  // ── Actions ─────────────────────────────────────────────────────────────────
  const promptInstall = useCallback(async () => {
    if (!deferredPromptRef.current) return
    await deferredPromptRef.current.prompt()
    const { outcome } = await deferredPromptRef.current.userChoice
    if (outcome === 'accepted') {
      setIsInstalled(true)
      setShowInstallBanner(false)
    }
    deferredPromptRef.current = null
  }, [])

  const dismissInstall = useCallback(() => {
    setShowInstallBanner(false)
    installDismissedRef.current = true
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }, [])

  const handleUpdate = useCallback(() => {
    setShowUpdate(false)
    if (swRegistration?.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
    window.location.reload()
  }, [swRegistration])

  const reload = useCallback(() => {
    window.location.reload()
  }, [])

  return (
    <PWAContext.Provider
      value={{ isInstalled, isOnline, canInstall: !!deferredPromptRef.current, promptInstall, reload }}
    >
      {/* Offline banner — top of screen */}
      {showOffline && <OfflineBanner />}

      {/* Back online toast */}
      {showOnlineToast && (
        <OnlineToast onDismiss={() => setShowOnlineToast(false)} />
      )}

      {/* SW update toast */}
      {showUpdate && (
        <UpdateToast
          onUpdate={handleUpdate}
          onDismiss={() => setShowUpdate(false)}
        />
      )}

      {/* Install banner */}
      {showInstallBanner && (
        <InstallBanner
          onInstall={promptInstall}
          onDismiss={dismissInstall}
        />
      )}

      {/* Reload button — only in standalone/installed mode */}
      {isInstalled && <PWAReloadButton onClick={reload} />}

      {children}
    </PWAContext.Provider>
  )
}