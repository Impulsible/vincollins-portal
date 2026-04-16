'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function StudentAttendancePage() {
  const router = useRouter()
  useEffect(() => {
    sessionStorage.setItem('studentActiveTab', 'attendance')
    router.replace('/student')
  }, [router])
  return null
}