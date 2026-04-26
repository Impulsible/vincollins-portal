// src/components/student/exam/views/CompletedView.tsx
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, Home, Eye, Trophy, CheckCircle2, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScoreSummary } from '../results/ScoreSummary'
import { ObjectiveBreakdown } from '../results/ObjectiveBreakdown'
import { ExamInfo } from '../results/ExamInfo'
import { TheoryStatus } from '../results/TheoryStatus'
import { StudentPhotoCard } from '../sidebar/StudentPhotoCard'
import type { Exam, StudentProfile, ExamResult, Question } from '@/app/student/exam/[id]/types'

interface CompletedViewProps {
  exam: Exam | null
  profile: StudentProfile | null
  examResult: ExamResult | null
  allQuestions: Question[]
  onBackToDashboard: () => void
  onViewFullResults: () => void
}

export function CompletedView({
  exam,
  profile,
  examResult,
  allQuestions,
  onBackToDashboard,
  onViewFullResults,
}: CompletedViewProps) {
  const theoryQuestions = allQuestions.filter(q => q.type === 'theory')
  const isPassed = examResult?.is_passed

  const statusConfig = {
    graded: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: CheckCircle2, label: 'Graded' },
    pending_theory: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: Clock, label: 'Pending Grading' },
    completed: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: Trophy, label: 'Completed' },
  }

  const status = examResult?.status || 'completed'
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.completed
  const StatusIcon = config.icon

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                  {exam?.title}
                </h1>
                <p className="text-sm text-gray-500">{exam?.subject}</p>
              </div>
            </div>
            <Badge className={cn(
              "ml-auto px-4 py-1.5 text-sm font-medium border",
              config.bg, config.text, config.border
            )}>
              <StatusIcon className="h-4 w-4 mr-1.5" />
              {config.label}
            </Badge>
          </div>
        </div>
      </div>

      {/* Result Banner */}
      <div className={cn(
        "border-b py-6 px-4",
        isPassed ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"
      )}>
        <div className="max-w-6xl mx-auto text-center">
          <div className={cn(
            "inline-flex h-16 w-16 rounded-full items-center justify-center mb-3",
            isPassed ? "bg-green-100" : "bg-red-100"
          )}>
            {isPassed ? (
              <Trophy className="h-8 w-8 text-green-600" />
            ) : (
              <Trophy className="h-8 w-8 text-red-400" />
            )}
          </div>
          <h2 className={cn(
            "text-2xl font-bold",
            isPassed ? "text-green-700" : "text-red-700"
          )}>
            {isPassed ? 'Congratulations! You Passed!' : 'Exam Completed'}
          </h2>
          <p className={cn(
            "text-lg mt-1",
            isPassed ? "text-green-600" : "text-red-600"
          )}>
            Score: {examResult?.score}/{examResult?.total} ({examResult?.percentage}%)
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">
            <StudentPhotoCard profile={profile} size="large" />
            <ScoreSummary examResult={examResult} />
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            <ExamInfo exam={exam} allQuestions={allQuestions} examResult={examResult} />
            <ObjectiveBreakdown examResult={examResult} />
            
            {theoryQuestions.length > 0 && (
              <TheoryStatus examResult={examResult} />
            )}

            {/* Actions */}
            <Card className="border shadow-sm bg-white">
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={onBackToDashboard}
                    className="flex-1 h-12"
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Back to Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onViewFullResults}
                    className="flex-1 h-12"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Full Results
                  </Button>
                </div>
              </CardContent>
            </Card>

            <p className="text-center text-sm text-gray-400">
              This exam has been completed. Each exam can only be taken once.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}