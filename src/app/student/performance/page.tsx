'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function StudentPerformancePage() {
  const router = useRouter()
  useEffect(() => {
    sessionStorage.setItem('studentActiveTab', 'performance')
    router.replace('/student')
  }, [router])
  return null
}