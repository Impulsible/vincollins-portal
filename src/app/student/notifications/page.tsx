'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function StudentNotificationsPage() {
  const router = useRouter()
  useEffect(() => {
    sessionStorage.setItem('studentActiveTab', 'notifications')
    router.replace('/student')
  }, [router])
  return null
}