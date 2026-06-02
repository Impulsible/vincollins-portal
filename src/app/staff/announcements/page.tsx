// app/staff/announcements/page.tsx - NO DUPLICATES (Clean version)
'use client'

import { StaffAnnouncements } from '@/components/staff/StaffAnnouncements'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function StaffAnnouncementsPage() {
  const router = useRouter()

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      {/* Back Button - Optional, since layout already has top bar */}
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

      {/* ✅ ONLY the announcements content - NO Header, NO Sidebar, NO Auth logic */}
      <StaffAnnouncements hideHeader={true} />
    </div>
  )
}