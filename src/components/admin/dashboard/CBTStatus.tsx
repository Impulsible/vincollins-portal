// components/admin/dashboard/CBTStatus.tsx
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MonitorPlay, FileText, AlertCircle, ChevronRight } from 'lucide-react'

interface CBTStatusProps {
  pendingExams?: number
  onViewAll?: () => void
}

export function CBTStatus({ pendingExams = 0, onViewAll }: CBTStatusProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MonitorPlay className="h-5 w-5 text-primary" />
          CBT Status
        </CardTitle>
        <CardDescription>Exam approvals and monitoring</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingExams > 0 ? (
          <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <span className="font-semibold text-yellow-800 dark:text-yellow-200">
                Pending Approvals
              </span>
              <Badge className="ml-auto bg-yellow-500 text-white">{pendingExams}</Badge>
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              {pendingExams} exam{pendingExams !== 1 ? 's' : ''} waiting for your review
            </p>
          </div>
        ) : (
          <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-green-800 dark:text-green-200">
                All Caught Up!
              </span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              No pending exam approvals
            </p>
          </div>
        )}
        
        <Button 
          variant="outline" 
          className="w-full"
          onClick={onViewAll}
        >
          View Exam Approvals
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}