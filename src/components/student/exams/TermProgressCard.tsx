// components/student/exams/TermProgressCard.tsx - COMPLETE FIXED VERSION

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
  stats,
  availableTerms,
  selectedTermSession,
  onTermChange,
  onRefresh,
}: TermProgressCardProps) {
  const completionPercentage = stats.totalSubjects > 0 
    ? Math.round((stats.completed / stats.totalSubjects) * 100) : 0

  // ✅ Grade styles for all possible grades
  const getGradeStyle = (grade: string) => {
    switch (grade) {
      case 'A':
        return "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800"
      case 'B':
        return "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800"
      case 'C':
        return "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800"
      case 'P':
        return "bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800"
      case 'F':
        return "bg-red-100 text-red-600 border-red-400 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800"
      default:
        return "bg-slate-50 text-slate-600 border-slate-300 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700"
    }
  }

  // ✅ Use stats.currentGrade directly from the database
  const displayGrade = stats.completed > 0 && stats.currentGrade && stats.currentGrade !== 'N/A'
    ? stats.currentGrade
    : 'N/A'

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
                      <SelectItem key={`${t.term}|${t.session_year}`} value={`${t.term}|${t.session_year}`}>
                        {t.label}
                      </SelectItem>
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
              
              {/* ✅ Show grade from stats.currentGrade */}
              {stats.completed > 0 && displayGrade !== 'N/A' && (
                <Badge className={cn(
                  "text-xs sm:text-sm font-semibold border px-3 py-1 rounded-full",
                  getGradeStyle(displayGrade)
                )}>
                  <Award className="h-3.5 w-3.5 mr-1" />
                  {displayGrade}
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
              {stats.completed} of {stats.totalSubjects} subjects completed • Average Score: {stats.averageScore}% • Grade: {displayGrade}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}