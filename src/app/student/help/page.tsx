'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function StudentHelpPage() {
  const router = useRouter()
  useEffect(() => {
    sessionStorage.setItem('studentActiveTab', 'help')
    router.replace('/student')
  }, [router])
  return null
}