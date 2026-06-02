// app/admin/announcements/page.tsx - FIXED (Show the New Announcement button)
'use client'

import { AnnouncementsManager } from '@/components/admin/announcements/AnnouncementsManager'
import { useUser } from '@/contexts/UserContext'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AdminAnnouncementsPage() {
  const router = useRouter()
  const { user } = useUser()

  const profile = user ? {
    id: user.id,
    full_name: user.full_name || 'Administrator',
    email: user.email || '',
    role: user.role || 'admin',
    photo_url: user.photo_url || undefined
  } : null

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      {/* Back Button */}
      <div className="mb-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.back()}
          className="text-slate-500 hover:text-slate-700 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </div>
      
      {/* ✅ DON'T hide header - admins need the "New Announcement" button */}
      <AnnouncementsManager profile={profile} hideHeader={false} />
    </div>
  )
}