// src/components/student/exams/TermProgressCard.tsx
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
    ? Math.round((stats.completed / stats.totalSubjects) * 100) 
    : 0

  return (
    <div className="mb-5 sm:mb-8">
      <Card className="border-0 shadow-sm bg-card">
        <CardContent className="p-4 sm:p-5 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Term Selector */}
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 w-full sm:w-auto">
              <History className="h-4 w-4 text-muted-foreground shrink-0" />
              
              {availableTerms.length > 0 ? (
                <Select
                  value={
                    selectedTermSession
                      ? `${selectedTermSession.term}|${selectedTermSession.session_year}`
                      : ''
                  }
                  onValueChange={onTermChange}
                >
                  <SelectTrigger className="border-0 h-auto p-0 shadow-none focus:ring-0 text-sm font-medium min-w-[200px] bg-transparent">
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTerms.map((t) => (
                      <SelectItem
                        key={`${t.term}|${t.session_year}`}
                        value={`${t.term}|${t.session_year}`}
                      >
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm font-medium py-1.5 text-muted-foreground">
                  Loading terms...
                </div>
              )}
            </div>

            {/* Stats Badges */}
            <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
              <Badge variant="outline" className="bg-background text-xs sm:text-sm">
                <BookOpen className="h-3.5 w-3.5 mr-1" />
                {stats.completed}/{stats.totalSubjects} Completed
              </Badge>
              
              {stats.completed > 0 && (
                <Badge 
                  className={cn(
                    "bg-opacity-20 text-xs sm:text-sm",
                    stats.gradeColor.replace('text', 'bg')
                  )}
                >
                  <Award className="h-3.5 w-3.5 mr-1" />
                  <span className={stats.gradeColor}>
                    Grade {stats.currentGrade}
                  </span>
                </Badge>
              )}
            </div>

            {/* Refresh Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              className="h-8 w-8 shrink-0"
              title="Refresh data"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Term Progress</span>
              <span className="text-sm text-muted-foreground">
                {completionPercentage}%
              </span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {stats.completed} of {stats.totalSubjects} subjects completed • 
              Average Score: {stats.averageScore}%
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}