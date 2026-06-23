'use client'

import { ReportCardApproval } from '@/components/admin/report-cards/ReportCardApproval'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

export default function ReportCardsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    }>
      <ReportCardApproval />
    </Suspense>
  )
}