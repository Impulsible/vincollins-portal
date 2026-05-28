// app/admin/announcements/page.tsx

'use client'

import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { AnnouncementsManager } from '@/components/admin/announcements/AnnouncementsManager'
import { useUser } from '@/contexts/UserContext'

export default function AdminAnnouncementsPage() {
  const { user } = useUser()

  const profile = user ? {
    id: user.id,
    full_name: user.full_name || 'Administrator',
    email: user.email || '',
    role: user.role || 'admin',
    photo_url: user.photo_url || undefined
  } : null

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    }>
      <AnnouncementsManager profile={profile} />
    </Suspense>
  )
}