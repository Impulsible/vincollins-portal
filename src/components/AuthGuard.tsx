// components/AuthGuard.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/UserContext'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
  allowedRoles: string[]
  redirectTo?: string
}

export function AuthGuard({ children, allowedRoles, redirectTo = '/portal' }: AuthGuardProps) {
  const { user, loading, isAuthenticated } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    if (!isAuthenticated || !user) {
      router.replace(redirectTo)
      return
    }

    const userRole = user.role?.toLowerCase()
    if (!allowedRoles.includes(userRole || '')) {
      router.replace(redirectTo)
      return
    }
  }, [loading, isAuthenticated, user, allowedRoles, redirectTo, router])

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return <>{children}</>
}