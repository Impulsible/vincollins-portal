// src/components/staff/analytics/GradeDistribution.tsx
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { Award } from 'lucide-react'

interface GradeDist { grade: string; count: number; pct: number }

const getGradeColor = (grade: string): string => {
  const c: Record<string, string> = { 'A1': 'bg-emerald-500', 'B2': 'bg-blue-500', 'B3': 'bg-sky-500', 'C4': 'bg-teal-500', 'C5': 'bg-amber-500', 'C6': 'bg-orange-500', 'D7': 'bg-yellow-500', 'E8': 'bg-red-400', 'F9': 'bg-red-600' }
  return c[grade] || 'bg-slate-500'
}

export function GradeDistribution({ data }: { data: GradeDist[] }) {
  if (data.length === 0) return <Card className="border-0 shadow-sm"><CardContent className="text-center py-10 text-slate-400">No grade data yet</CardContent></Card>

  const total = data.reduce((s, g) => s + g.count, 0)

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <CardContent className="p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 mb-2"><Award className="h-4 w-4 text-amber-500" /><span className="text-sm font-semibold">Grade Distribution ({total} students)</span></div>
        {data.map(g => (
          <div key={g.grade} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Badge className={cn("text-xs font-semibold", getGradeColor(g.grade).replace('bg-', 'bg-').replace('500', '100').replace('600', '100').replace('400', '100') + ' text-' + getGradeColor(g.grade).replace('bg-', '').replace('500', '700').replace('600', '700').replace('400', '600'))}>{g.grade}</Badge>
                <span className="text-slate-500">{g.count} student{g.count !== 1 ? 's' : ''}</span>
              </div>
              <span className="font-medium">{g.pct}%</span>
            </div>
            <Progress value={g.pct} className="h-2" style={{ background: '#f1f5f9' }}>
              <div className={cn("h-full rounded-full", getGradeColor(g.grade))} style={{ width: `${g.pct}%` }} />
            </Progress>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}