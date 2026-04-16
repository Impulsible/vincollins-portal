'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function StudentExamsPage() {
  const router = useRouter()
  useEffect(() => {
    sessionStorage.setItem('studentActiveTab', 'exams')
    router.replace('/student')
  }, [router])
  return null
}