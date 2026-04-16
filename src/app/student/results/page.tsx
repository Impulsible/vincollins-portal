'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function StudentResultsPage() {
  const router = useRouter()
  useEffect(() => {
    sessionStorage.setItem('studentActiveTab', 'results')
    router.replace('/student')
  }, [router])
  return null
}