// components/student/AvailableExamsList.tsx - ENHANCED
'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MonitorPlay, ChevronRight, Clock, FileText, Award, Target } from 'lucide-react'

interface Exam {
  id: string
  title: string
  subject: string
  duration: number
  total_questions: number
  total_marks: number
  passing_percentage?: number
  has_theory?: boolean
  term?: string
  session_year?: string
}

interface AvailableExamsListProps {
  exams: Exam[]
  onTakeExam: (examId: string) => void
  onViewAll?: () => void  // Optional "View All" handler
  showViewAll?: boolean   // Whether to show the "View All" button
  compact?: boolean       // Compact mode for dashboard preview
  currentTerm?: string    // Display current term
}

export function AvailableExamsList({ 
  exams, 
  onTakeExam, 
  onViewAll, 
  showViewAll = false,
  compact = false,
  currentTerm
}: AvailableExamsListProps) {
  
  const displayExams = compact ? exams.slice(0, 3) : exams

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className={compact ? "pb-2" : ""}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MonitorPlay className="h-5 w-5 text-primary" />
              Available Exams
              {currentTerm && (
                <Badge variant="outline" className="ml-2 text-xs">
                  {currentTerm}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {compact ? 'Recent available exams' : 'Start any available exam instantly'}
            </CardDescription>
          </div>
          {showViewAll && onViewAll && (
            <Button variant="ghost" size="sm" onClick={onViewAll}>
              View All <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className={compact ? "space-y-2" : "space-y-4"}>
        {displayExams.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No exams available at the moment
          </p>
        ) : (
          displayExams.map((exam) => (
            <div 
              key={exam.id} 
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{exam.title}</p>
                <p className="text-sm text-muted-foreground">{exam.subject}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {exam.total_questions} Qs
                  </span>
                  <span className="flex items-center gap-1">
                    <Award className="h-3 w-3" />
                    {exam.total_marks} marks
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {exam.duration} mins
                  </span>
                  {exam.passing_percentage && (
                    <span className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {exam.passing_percentage}% pass
                    </span>
                  )}
                </div>
                {exam.has_theory && (
                  <Badge variant="outline" className="mt-1 text-[10px] bg-purple-50 text-purple-700">
                    Includes Theory
                  </Badge>
                )}
              </div>
              <Button
                size="sm"
                onClick={() => onTakeExam(exam.id)}
                className="bg-primary hover:bg-primary/90 shrink-0 w-full sm:w-auto"
              >
                Take Exam
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          ))
        )}
        
        {/* Show "View All" button at bottom for compact mode with many exams */}
        {compact && exams.length > 3 && onViewAll && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full mt-2"
            onClick={onViewAll}
          >
            View all {exams.length} exams
            <ChevronRight className="ml-1 h-3 w-3" />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}