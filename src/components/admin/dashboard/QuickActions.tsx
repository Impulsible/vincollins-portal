/* eslint-disable @typescript-eslint/no-explicit-any */
// components/admin/dashboard/QuickActions.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  UserPlus, 
  Plus, 
  Award, 
  Activity, 
  FileText, 
  BarChart3,
  ChevronRight
} from 'lucide-react'

interface QuickAction {
  label: string
  icon: any
  onClick: () => void
  color: string
  bgColor: string
}

interface QuickActionsProps {
  onAddStudent: () => void
  onCreateExam: () => void
  onGradeTheory: () => void
  onMonitorCBT: () => void
  onViewSubmissions: () => void
  onGenerateResults: () => void
}

export function QuickActions({ 
  onAddStudent, 
  onCreateExam, 
  onGradeTheory, 
  onMonitorCBT,
  onViewSubmissions,
  onGenerateResults
}: QuickActionsProps) {
  const actions: QuickAction[] = [
    { label: 'Add New Student', icon: UserPlus, onClick: onAddStudent, color: 'text-emerald-600', bgColor: 'bg-emerald-50 dark:bg-emerald-950/20' },
    { label: 'Create Exam', icon: Plus, onClick: onCreateExam, color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-950/20' },
    { label: 'Grade Theory', icon: Award, onClick: onGradeTheory, color: 'text-orange-600', bgColor: 'bg-orange-50 dark:bg-orange-950/20' },
    { label: 'Monitor CBT', icon: Activity, onClick: onMonitorCBT, color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-950/20' },
    { label: 'View Submissions', icon: FileText, onClick: onViewSubmissions, color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-950/20' },
    { label: 'Generate Results', icon: BarChart3, onClick: onGenerateResults, color: 'text-rose-600', bgColor: 'bg-rose-50 dark:bg-rose-950/20' },
  ]

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
        <p className="text-sm text-muted-foreground">Common administrative tasks</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant="ghost"
            className="w-full justify-between group hover:bg-muted"
            onClick={action.onClick}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${action.bgColor}`}>
                <action.icon className={`h-4 w-4 ${action.color}`} />
              </div>
              <span className="text-sm font-medium">{action.label}</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}