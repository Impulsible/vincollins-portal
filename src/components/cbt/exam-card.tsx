/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Clock, 
  BookOpen, 
  Award, 
  Users, 
  Calendar,
  TrendingUp,
  Lock,
  Play,
  FileText,
  ChevronRight,
  Sparkles,
  Shield,
  Eye
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Exam {
  id: string
  title: string
  subject: string
  category: 'junior' | 'senior-science' | 'senior-arts'
  class: string
  duration: number
  total_questions: number
  status: 'draft' | 'published' | 'archived'
  instructions: string
  passing_score: number
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced'
  created_by: string
  teacher_name?: string
  attempts?: number
  average_score?: number
  requires_access_code?: boolean
  isPractice?: boolean
  passingScore?: number
  averageScore?: number
}

interface ExamCardProps {
  exam: Exam
  onStart: (examId: string) => void
  variant?: 'grid' | 'list'
  index?: number
  Icon?: any
  userRole?: string
}

export function ExamCard({ exam, onStart, variant = 'grid', index = 0, Icon, userRole }: ExamCardProps) {
  // Get the actual values, handling both naming conventions
  const isPractice = exam.isPractice === true
  const passingScore = exam.passing_score || exam.passingScore || 50
  const averageScore = exam.average_score || exam.averageScore || 0
  const attempts = exam.attempts || 0
  const difficulty = exam.difficulty || 'Intermediate'
  
  const getStatusColor = () => {
    if (isPractice) return 'bg-purple-100 text-purple-700 border-purple-200'
    switch (exam.status) {
      case 'published':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'draft':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getDifficultyColor = () => {
    switch (difficulty) {
      case 'Beginner':
        return 'text-green-600 bg-green-50'
      case 'Intermediate':
        return 'text-yellow-600 bg-yellow-50'
      case 'Advanced':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const formatDuration = (minutes: number) => {
    if (minutes === 0) return 'No time limit'
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
    }
    return `${minutes} mins`
  }

  const isAvailable = exam.status === 'published' || isPractice

  if (variant === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary">
          <div className="flex flex-col md:flex-row md:items-center justify-between p-4 gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge className={cn("capitalize", getStatusColor())}>
                  {isPractice ? 'Practice Mode' : exam.status}
                </Badge>
                <Badge variant="outline" className={getDifficultyColor()}>
                  {difficulty}
                </Badge>
                {exam.requires_access_code && (
                  <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">
                    <Lock className="h-3 w-3 mr-1" />
                    Access Code
                  </Badge>
                )}
                {isPractice && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Unlimited Attempts
                  </Badge>
                )}
              </div>
              <h3 className="font-semibold text-lg mb-1 flex items-center gap-2">
                {Icon && <Icon className="h-5 w-5 text-primary" />}
                {exam.title}
              </h3>
              <p className="text-sm text-gray-500">{exam.subject} • {exam.class}</p>
              {exam.teacher_name && (
                <p className="text-xs text-gray-400 mt-1">By {exam.teacher_name}</p>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>{formatDuration(exam.duration)}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <FileText className="h-4 w-4" />
                <span>{exam.total_questions} questions</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Award className="h-4 w-4" />
                <span>Pass: {passingScore}%</span>
              </div>
              {!isPractice && attempts > 0 && (
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <TrendingUp className="h-4 w-4" />
                  <span>{averageScore}% avg</span>
                </div>
              )}
              <Button 
                onClick={() => onStart(exam.id)}
                disabled={!isAvailable}
                className={cn(
                  "gap-2",
                  isAvailable && "bg-primary hover:bg-primary/90"
                )}
              >
                {isPractice ? (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Start Practice
                  </>
                ) : exam.status === 'published' ? (
                  <>
                    <Play className="h-4 w-4" />
                    Start Exam
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Not Available
                  </>
                )}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -4 }}
    >
      <Card className="h-full hover:shadow-xl transition-all duration-300 overflow-hidden group">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
        
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="flex gap-2 flex-wrap">
              <Badge className={cn("capitalize", getStatusColor())}>
                {isPractice ? 'Practice Mode' : exam.status}
              </Badge>
              <Badge variant="outline" className={getDifficultyColor()}>
                {difficulty}
              </Badge>
              {exam.requires_access_code && (
                <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">
                  <Lock className="h-3 w-3 mr-1" />
                  Code
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            {Icon && <Icon className="h-6 w-6 text-primary" />}
            <h3 className="font-bold text-xl line-clamp-2">{exam.title}</h3>
          </div>
          <p className="text-sm text-gray-500">{exam.subject} • {exam.class}</p>
          {exam.teacher_name && (
            <p className="text-xs text-gray-400">By {exam.teacher_name}</p>
          )}
        </CardHeader>
        
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-gray-500">
              <Clock className="h-4 w-4" />
              <span>{formatDuration(exam.duration)}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-500">
              <FileText className="h-4 w-4" />
              <span>{exam.total_questions} Questions</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-gray-500">
              <Award className="h-4 w-4" />
              <span>Pass: {passingScore}%</span>
            </div>
            {!isPractice && attempts > 0 && (
              <div className="flex items-center gap-1 text-green-600">
                <TrendingUp className="h-4 w-4" />
                <span>{averageScore}% avg</span>
              </div>
            )}
          </div>
          
          {isPractice && (
            <div className="flex items-center gap-1 text-purple-600 text-sm">
              <Sparkles className="h-4 w-4" />
              <span>Unlimited practice attempts</span>
            </div>
          )}
          
          <p className="text-xs text-gray-500 line-clamp-2 mt-2">
            {exam.instructions}
          </p>
        </CardContent>
        
        <CardFooter>
          <Button 
            onClick={() => onStart(exam.id)}
            disabled={!isAvailable}
            className={cn(
              "w-full gap-2 group",
              isAvailable && "bg-primary hover:bg-primary/90"
            )}
          >
            {isPractice ? (
              <>
                <Sparkles className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                Start Practice
              </>
            ) : exam.status === 'published' ? (
              <>
                <Play className="h-4 w-4 group-hover:scale-110 transition-transform" />
                Start Examination
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                Not Available
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}