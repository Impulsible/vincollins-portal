/* eslint-disable @typescript-eslint/no-unused-vars */
// components/staff/QuickActions.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, FileText, Upload, Users, Sparkles } from 'lucide-react'

interface QuickActionsProps {
  onCreateExam: () => void
  onCreateAssignment: () => void
  onUploadNote: () => void
}

export function QuickActions({ onCreateExam, onCreateAssignment, onUploadNote }: QuickActionsProps) {
  const actions = [
    { label: 'Create Exam', icon: BookOpen, onClick: onCreateExam, color: 'from-blue-500 to-blue-600' },
    { label: 'Create Assignment', icon: FileText, onClick: onCreateAssignment, color: 'from-emerald-500 to-emerald-600' },
    { label: 'Upload Note', icon: Upload, onClick: onUploadNote, color: 'from-purple-500 to-purple-600' },
  ]

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              className={`h-auto py-4 flex-col gap-2 bg-gradient-to-r ${action.color} text-white hover:opacity-90 border-0`}
              onClick={action.onClick}
            >
              <action.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}