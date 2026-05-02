// src/components/staff/analytics/AnalyticsOverview.tsx
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Users, BookOpen, Target, TrendingUp, Trophy, AlertCircle } from 'lucide-react'

interface OverviewProps { overview: { totalStudents: number; activeClasses: number; totalExams: number; avgScore: number; passRate: number; pendingGrading: number } }

export function AnalyticsOverview({ overview }: OverviewProps) {
  const cards = [
    { l: 'Students', v: overview.totalStudents, i: Users, c: 'text-blue-600 bg-blue-50' },
    { l: 'Active Classes', v: overview.activeClasses, i: BookOpen, c: 'text-purple-600 bg-purple-50' },
    { l: 'Exams', v: overview.totalExams, i: Target, c: 'text-teal-600 bg-teal-50' },
    { l: 'Avg Score', v: `${overview.avgScore}%`, i: TrendingUp, c: 'text-emerald-600 bg-emerald-50' },
    { l: 'Pass Rate', v: `${overview.passRate}%`, i: Trophy, c: 'text-amber-600 bg-amber-50' },
    { l: 'Pending', v: overview.pendingGrading, i: AlertCircle, c: 'text-red-600 bg-red-50' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
      {cards.map((s, i) => (
        <Card key={i} className="border-0 shadow-sm">
          <CardContent className="p-3 sm:p-4 flex items-center gap-3">
            <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", s.c.split(' ')[1])}><s.i className={cn("h-4 w-4", s.c.split(' ')[0])} /></div>
            <div className="min-w-0"><p className="text-[11px] text-slate-400">{s.l}</p><p className="text-lg font-bold">{s.v}</p></div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}