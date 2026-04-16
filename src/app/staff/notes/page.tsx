'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function StaffNotesPage() {
  const router = useRouter()
  useEffect(() => {
    sessionStorage.setItem('staffActiveTab', 'notes')
    router.replace('/staff')
  }, [router])
  return null
}