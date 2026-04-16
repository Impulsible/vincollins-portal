'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function StaffStudentsPage() {
  const router = useRouter()
  useEffect(() => {
    sessionStorage.setItem('staffActiveTab', 'students')
    router.replace('/staff')
  }, [router])
  return null
}