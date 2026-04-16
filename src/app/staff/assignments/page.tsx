'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function StaffAssignmentsPage() {
  const router = useRouter()
  useEffect(() => {
    sessionStorage.setItem('staffActiveTab', 'assignments')
    router.replace('/staff')
  }, [router])
  return null
}