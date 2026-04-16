'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function StudentAssignmentsPage() {
  const router = useRouter()
  useEffect(() => {
    sessionStorage.setItem('studentActiveTab', 'assignments')
    router.replace('/student')
  }, [router])
  return null
}