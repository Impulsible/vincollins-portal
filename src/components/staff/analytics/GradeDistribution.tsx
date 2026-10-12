// src/components/staff/analytics/GradeDistribution.tsx - WITH DARK MODE
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
    'A1': 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400', 
    'B2': 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400', 
    'B3': 'bg-sky-100 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400', 
    'C4': 'bg-teal-100 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400', 
    'C5': 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400', 
    'C6': 'bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400', 
    'D7': 'bg-yellow-100 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-400', 
    'E8': 'bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400', 
    'F9': 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400' 
  }
  return c[grade] || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
}

export function GradeDistribution({ data, termInfo }: GradeDistributionProps) {
  if (data.length === 0) return (
    <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
      <CardContent className="text-center py-10 text-slate-400 dark:text-slate-500">
        <Award className="h-8 w-8 mx-auto mb-2 opacity-30" />
        <p>No grade data yet</p>
        {termInfo && termInfo.termName && (
          <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">
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
    <Card className="border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900 transition-colors duration-300">
      {termInfo && termInfo.termName && (
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
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

      <div className="grid grid-cols-3 gap-0 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="px-4 py-2.5 text-center border-r border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">Total Students</p>
          <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{total}</p>
        </div>
        <div className="px-4 py-2.5 text-center border-r border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">Passing</p>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{passingCount}</p>
        </div>
        <div className="px-4 py-2.5 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">Pass Rate</p>
          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{passRate}%</p>
        </div>
      </div>

      <CardContent className="p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Award className="h-4 w-4 text-amber-500 dark:text-amber-400" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Grade Distribution</span>
        </div>
        {data.map(g => (
          <div key={g.grade} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Badge className={cn("text-xs font-semibold border-0", getBadgeColor(g.grade))}>
                  {g.grade}
                </Badge>
                <span className="text-slate-500 dark:text-slate-400">{g.count || 0} student{(g.count || 0) !== 1 ? 's' : ''}</span>
              </div>
              <span className="font-medium text-slate-700 dark:text-slate-300">{g.pct || 0}%</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={cn("h-2 rounded-full transition-all duration-500", getGradeColor(g.grade))}
                style={{ width: `${Math.min(g.pct || 0, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}