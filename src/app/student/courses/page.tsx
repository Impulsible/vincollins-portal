'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function StudentCoursesPage() {
  const router = useRouter()
  useEffect(() => {
    sessionStorage.setItem('studentActiveTab', 'courses')
    router.replace('/student')
  }, [router])
  return null
}