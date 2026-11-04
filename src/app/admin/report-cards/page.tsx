'use client'

import { ReportCardApproval } from '@/components/admin/report-cards/ReportCardApproval'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

export default function ReportCardsPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 dark:text-purple-400" />
        </div>
      }>
        <ReportCardApproval />
      </Suspense>
    </div>
  )
}