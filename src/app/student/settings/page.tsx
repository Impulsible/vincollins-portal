'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function StudentSettingsPage() {
  const router = useRouter()
  useEffect(() => {
    sessionStorage.setItem('studentActiveTab', 'settings')
    router.replace('/student')
  }, [router])
  return null
}