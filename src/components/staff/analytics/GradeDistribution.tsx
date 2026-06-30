// src/components/staff/analytics/GradeDistribution.tsx
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { Award } from 'lucide-react'

interface GradeDist { grade: string; count: number; pct: number }

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

export function GradeDistribution({ data }: { data: GradeDist[] }) {
  if (data.length === 0) return (
    <Card className="border-0 shadow-sm">
      <CardContent className="text-center py-10 text-slate-400">
        <Award className="h-8 w-8 mx-auto mb-2 opacity-30" />
        <p>No grade data yet</p>
      </CardContent>
    </Card>
  )

  const total = data.reduce((s, g) => s + g.count, 0)

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <CardContent className="p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Award className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-semibold">Grade Distribution ({total} students)</span>
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
            <Progress value={g.pct || 0} className="h-2 bg-slate-100 [&>div]:${getGradeColor(g.grade)}" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}