'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PortalLoginRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the actual login page
    router.replace('/auth/login')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-gray-500">Redirecting to login portal...</p>
      </div>
    </div>
  )
}