// src/components/student/exams/TermProgressCard.tsx
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { History, BookOpen, Award, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StatsState, TermOption, TermSession } from '@/app/student/exams/types'

interface TermProgressCardProps {
  stats: StatsState
  availableTerms: TermOption[]
  selectedTermSession: TermSession | null
  onTermChange: (value: string) => void
  onRefresh: () => void
}

export function TermProgressCard({
  stats, availableTerms, selectedTermSession, onTermChange, onRefresh,
}: TermProgressCardProps) {
  const completionPercentage = stats.totalSubjects > 0 
    ? Math.round((stats.completed / stats.totalSubjects) * 100) : 0

  const getGradeStyle = (grade: string) => {
    switch (grade) {
      case 'A1': return "bg-emerald-50 text-emerald-700 border-emerald-300"
      case 'B2': return "bg-blue-50 text-blue-700 border-blue-300"
      case 'B3': return "bg-sky-50 text-sky-700 border-sky-300"
      case 'C4': return "bg-teal-50 text-teal-700 border-teal-300"
      case 'C5': return "bg-amber-50 text-amber-700 border-amber-300"
      case 'C6': return "bg-orange-50 text-orange-700 border-orange-300"
      case 'D7': return "bg-yellow-50 text-yellow-700 border-yellow-300"
      case 'E8': return "bg-red-50 text-red-400 border-red-300"
      case 'F9': return "bg-red-100 text-red-600 border-red-400"
      default: return "bg-slate-50 text-slate-600 border-slate-300"
    }
  }

  return (
    <div className="mb-5 sm:mb-8">
      <Card className="border-0 shadow-sm bg-card">
        <CardContent className="p-4 sm:p-5 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 w-full sm:w-auto">
              <History className="h-4 w-4 text-muted-foreground shrink-0" />
              {availableTerms.length > 0 ? (
                <Select
                  value={selectedTermSession ? `${selectedTermSession.term}|${selectedTermSession.session_year}` : ''}
                  onValueChange={onTermChange}
                >
                  <SelectTrigger className="border-0 h-auto p-0 shadow-none focus:ring-0 text-sm font-medium min-w-[200px] bg-transparent">
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTerms.map((t) => (
                      <SelectItem key={`${t.term}|${t.session_year}`} value={`${t.term}|${t.session_year}`}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm font-medium py-1.5 text-muted-foreground">Loading terms...</div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
              <Badge variant="outline" className="bg-background text-xs sm:text-sm">
                <BookOpen className="h-3.5 w-3.5 mr-1" />
                {stats.completed}/{stats.totalSubjects} Completed
              </Badge>
              
              {stats.completed > 0 && stats.currentGrade !== 'N/A' && (
                <Badge className={cn(
                  "text-xs sm:text-sm font-semibold border px-3 py-1 rounded-full",
                  getGradeStyle(stats.currentGrade)
                )}>
                  <Award className="h-3.5 w-3.5 mr-1" />
                  {stats.currentGrade}
                </Badge>
              )}
            </div>

            <Button variant="ghost" size="icon" onClick={onRefresh} className="h-8 w-8 shrink-0" title="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Term Progress</span>
              <span className="text-sm text-muted-foreground">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {stats.completed} of {stats.totalSubjects} subjects completed • Average Score: {stats.averageScore}%
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}