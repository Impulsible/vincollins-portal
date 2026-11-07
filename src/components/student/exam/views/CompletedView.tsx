// src/components/student/exam/views/CompletedView.tsx
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, Home, Eye, Trophy, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScoreSummary } from '../results/ScoreSummary'
import { ObjectiveBreakdown } from '../results/ObjectiveBreakdown'
import { ExamInfo } from '../results/ExamInfo'
import { TheoryStatus } from '../results/TheoryStatus'
import { StudentPhotoCard } from '../sidebar/StudentPhotoCard'
import type { Exam, ExamResult, Question } from '@/app/student/exam/[id]/types'

type StudentProfile = {
  id?: string | number
  full_name?: string | null
  name?: string | null
  avatar_url?: string | null
  profile_photo?: string | null
  photo_url?: string | null
  image_url?: string | null
  [key: string]: unknown
}

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
  
  const isPending = examResult?.status === 'pending_theory'
  const isPassed = examResult?.is_passed && !isPending

  // 🛠️ READ DYNAMIC BOUNDS FROM DB (No hardcoding)
  const totalExamMax = examResult?.total_marks || ((examResult?.objective_total || 0) + (examResult?.theory_total || 0))
  const objectiveMax = examResult?.objective_total || 0
  
  const statusConfig = {
    graded: { 
      bg: 'bg-green-50 dark:bg-green-950/40', 
      text: 'text-green-700 dark:text-green-300', 
      border: 'border-green-200 dark:border-green-900/50', 
      icon: CheckCircle2, 
      label: 'Graded' 
    },
    pending_theory: { 
      bg: 'bg-amber-50 dark:bg-amber-950/40', 
      text: 'text-amber-700 dark:text-amber-300', 
      border: 'border-amber-200 dark:border-amber-900/50', 
      icon: Clock, 
      label: 'Pending Grading' 
    },
    completed: { 
      bg: 'bg-blue-50 dark:bg-blue-950/40', 
      text: 'text-blue-700 dark:text-blue-300', 
      border: 'border-blue-200 dark:border-blue-900/50', 
      icon: Trophy, 
      label: 'Completed' 
    },
  }

  const status = examResult?.status || 'completed'
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.completed
  const StatusIcon = config.icon

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-slate-950 dark:to-slate-900 transition-colors duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 shadow-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                  {exam?.title}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">{exam?.subject}</p>
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
        "border-b py-8 px-4 transition-colors",
        isPending 
          ? "bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/50" 
          : isPassed 
            ? "bg-green-50 dark:bg-green-950/30 border-green-100 dark:border-green-900/50" 
            : "bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900/50"
      )}>
        <div className="max-w-6xl mx-auto text-center">
          <div className={cn(
            "inline-flex h-16 w-16 rounded-full items-center justify-center mb-3 shadow-sm",
            isPending 
              ? "bg-amber-100 dark:bg-amber-900/50" 
              : isPassed 
                ? "bg-green-100 dark:bg-green-900/50" 
                : "bg-red-100 dark:bg-red-900/50"
          )}>
            {isPending ? (
              <Clock className="h-8 w-8 text-amber-500 dark:text-amber-400" />
            ) : isPassed ? (
              <Trophy className="h-8 w-8 text-green-600 dark:text-green-400" />
            ) : (
              <XCircle className="h-8 w-8 text-red-500 dark:text-red-400" />
            )}
          </div>
          <h2 className={cn(
            "text-2xl font-bold",
            isPending 
              ? "text-amber-700 dark:text-amber-300" 
              : isPassed 
                ? "text-green-700 dark:text-green-300" 
                : "text-red-700 dark:text-red-300"
          )}>
            {isPending ? 'Exam Pending Grading' : isPassed ? 'Congratulations! You Passed!' : 'Exam Completed'}
          </h2>
          
          <p className={cn(
            "text-lg mt-1 font-medium",
            isPending 
              ? "text-amber-600 dark:text-amber-400" 
              : isPassed 
                ? "text-green-600 dark:text-green-400" 
                : "text-red-600 dark:text-red-400"
          )}>
            {isPending 
              ? `Objective Score: ${examResult?.objective_score || 0} / ${objectiveMax} (Theory Pending)` 
              : `Score: ${(examResult?.objective_score || 0) + (examResult?.theory_score || 0)} / ${totalExamMax} (${examResult?.percentage || 0}%)`}
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
            <Card className="border shadow-sm bg-white dark:bg-slate-900 dark:border-slate-800">
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
                    className="flex-1 h-12 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Full Results
                  </Button>
                </div>
              </CardContent>
            </Card>

            <p className="text-center text-sm text-gray-400 dark:text-gray-500">
              This exam has been completed. Each exam can only be taken once.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}