// src/components/staff/analytics/AnalyticsOverview.tsx - WITH TERM & SESSION DISPLAY
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
    { label: 'Students', value: overview.totalStudents || 0, icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Active Classes', value: overview.activeClasses || 0, icon: BookOpen, color: 'text-purple-600 bg-purple-50' },
    { label: 'Exams', value: overview.totalExams || 0, icon: Target, color: 'text-teal-600 bg-teal-50' },
    { label: 'Avg Score', value: `${overview.avgScore || 0}%`, icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Pass Rate', value: `${overview.passRate || 0}%`, icon: Trophy, color: 'text-amber-600 bg-amber-50' },
    { label: 'Pending', value: overview.pendingGrading || 0, icon: AlertCircle, color: 'text-red-600 bg-red-50' },
  ]

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* ✅ Term Info Badge */}
      {termInfo && termInfo.termName && (
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 rounded-lg px-3 py-1.5">
          <Calendar className="h-3.5 w-3.5 text-emerald-600" />
          <span className="font-medium text-slate-700">{termInfo.termName}</span>
          <span className="text-slate-300">·</span>
          <span className="font-medium text-slate-700">{termInfo.sessionYear}</span>
          {termInfo.isCurrent && (
            <Badge className="ml-1 bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]">
              Current
            </Badge>
          )}
        </div>
      )}

      {/* ✅ Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        {cards.map((card, i) => (
          <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-3 sm:p-4 flex items-center gap-3">
              <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", card.color.split(' ')[1])}>
                <card.icon className={cn("h-4 w-4", card.color.split(' ')[0])} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-slate-500 font-medium">{card.label}</p>
                <p className="text-lg font-bold text-slate-800">{card.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}