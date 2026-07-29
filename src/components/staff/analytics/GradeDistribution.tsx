// src/components/staff/analytics/GradeDistribution.tsx - WITH TERM & SESSION DISPLAY
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { Award, Calendar } from 'lucide-react'

interface GradeDist { grade: string; count: number; pct: number }

interface GradeDistributionProps {
  data: GradeDist[]
  termInfo?: {
    termName: string
    sessionYear: string
    termCode: string
    isCurrent: boolean
  }
}

const getGradeColor = (grade: string): string => {
  const c: Record<string, string> = { 
    'A1': 'bg-emerald-500', 'B2': 'bg-blue-500', 'B3': 'bg-sky-500', 
    'C4': 'bg-teal-500', 'C5': 'bg-amber-500', 'C6': 'bg-orange-500', 
    'D7': 'bg-yellow-500', 'E8': 'bg-red-400', 'F9': 'bg-red-600' 
  }
  return c[grade] || 'bg-slate-500'
}

const getBadgeColor = (grade: string): string => {
  const c: Record<string, string> = { 
    'A1': 'bg-emerald-100 text-emerald-700', 'B2': 'bg-blue-100 text-blue-700', 
    'B3': 'bg-sky-100 text-sky-700', 'C4': 'bg-teal-100 text-teal-700', 
    'C5': 'bg-amber-100 text-amber-700', 'C6': 'bg-orange-100 text-orange-700', 
    'D7': 'bg-yellow-100 text-yellow-700', 'E8': 'bg-red-100 text-red-600', 
    'F9': 'bg-red-100 text-red-700' 
  }
  return c[grade] || 'bg-slate-100 text-slate-700'
}

export function GradeDistribution({ data, termInfo }: GradeDistributionProps) {
  if (data.length === 0) return (
    <Card className="border-0 shadow-sm">
      <CardContent className="text-center py-10 text-slate-400">
        <Award className="h-8 w-8 mx-auto mb-2 opacity-30" />
        <p>No grade data yet</p>
        {termInfo && termInfo.termName && (
          <p className="text-xs text-slate-300 mt-1">
            No grades for {termInfo.termName} {termInfo.sessionYear}
          </p>
        )}
      </CardContent>
    </Card>
  )

  const total = data.reduce((s, g) => s + g.count, 0)
  const passingCount = data.filter(g => ['A1', 'B2', 'B3', 'C4', 'C5', 'C6', 'D7', 'E8'].includes(g.grade))
    .reduce((s, g) => s + g.count, 0)
  const passRate = total > 0 ? Math.round((passingCount / total) * 100) : 0

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      {/* ✅ Term Info Header */}
      {termInfo && termInfo.termName && (
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2 text-xs text-slate-500">
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

      {/* ✅ Summary Stats Bar */}
      <div className="grid grid-cols-3 gap-0 border-b border-slate-100 bg-white">
        <div className="px-4 py-2.5 text-center border-r border-slate-100">
          <p className="text-xs text-slate-500">Total Students</p>
          <p className="text-lg font-bold text-slate-800">{total}</p>
        </div>
        <div className="px-4 py-2.5 text-center border-r border-slate-100">
          <p className="text-xs text-slate-500">Passing</p>
          <p className="text-lg font-bold text-emerald-600">{passingCount}</p>
        </div>
        <div className="px-4 py-2.5 text-center">
          <p className="text-xs text-slate-500">Pass Rate</p>
          <p className="text-lg font-bold text-blue-600">{passRate}%</p>
        </div>
      </div>

      <CardContent className="p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Award className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-semibold">Grade Distribution</span>
        </div>
        {data.map(g => (
          <div key={g.grade} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Badge className={cn("text-xs font-semibold", getBadgeColor(g.grade))}>
                  {g.grade}
                </Badge>
                <span className="text-slate-500">{g.count || 0} student{(g.count || 0) !== 1 ? 's' : ''}</span>
              </div>
              <span className="font-medium">{g.pct || 0}%</span>
            </div>
            <Progress 
              value={g.pct || 0} 
              className="h-2 bg-slate-100 [&>div]:${getGradeColor(g.grade)}" 
            />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}