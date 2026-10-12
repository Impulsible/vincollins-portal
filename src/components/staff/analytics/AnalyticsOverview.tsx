// src/components/staff/analytics/AnalyticsOverview.tsx - WITH DARK MODE
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Users, BookOpen, Target, TrendingUp, Trophy, AlertCircle, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface OverviewProps { 
  overview: { 
    totalStudents: number
    activeClasses: number
    totalExams: number
    avgScore: number
    passRate: number
    pendingGrading: number
  }
  termInfo?: {
    termName: string
    sessionYear: string
    termCode: string
    isCurrent: boolean
  }
}

export function AnalyticsOverview({ overview, termInfo }: OverviewProps) {
  const cards = [
    { label: 'Students', value: overview.totalStudents || 0, icon: Users, color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40' },
    { label: 'Active Classes', value: overview.activeClasses || 0, icon: BookOpen, color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40' },
    { label: 'Exams', value: overview.totalExams || 0, icon: Target, color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40' },
    { label: 'Avg Score', value: `${overview.avgScore || 0}%`, icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40' },
    { label: 'Pass Rate', value: `${overview.passRate || 0}%`, icon: Trophy, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40' },
    { label: 'Pending', value: overview.pendingGrading || 0, icon: AlertCircle, color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40' },
  ]

  return (
    <div className="space-y-3 sm:space-y-4 transition-colors duration-300">
      {termInfo && termInfo.termName && (
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5">
          <Calendar className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="font-medium text-slate-700 dark:text-slate-200">{termInfo.termName}</span>
          <span className="text-slate-300 dark:text-slate-600">·</span>
          <span className="font-medium text-slate-700 dark:text-slate-200">{termInfo.sessionYear}</span>
          {termInfo.isCurrent && (
            <Badge className="ml-1 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-[10px]">
              Current
            </Badge>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        {cards.map((card, i) => (
          <Card 
            key={i} 
            className="border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md dark:hover:shadow-slate-950/50 transition-all bg-white dark:bg-slate-900"
          >
            <CardContent className="p-3 sm:p-4 flex items-center gap-3">
              <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", card.color.split(' ').slice(1).join(' '))}>
                <card.icon className={cn("h-4 w-4", card.color.split(' ')[0])} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{card.label}</p>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{card.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}