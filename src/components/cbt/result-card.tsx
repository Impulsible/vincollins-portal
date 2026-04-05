/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Download, 
  Award, 
  Clock, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  BarChart3, 
  Share2, 
  Printer,
  Star,
  Trophy,
  Target,
  Zap,
  ThumbsUp,
  AlertCircle
} from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ResultCardProps {
  result: {
    exam_title: string
    score: number
    total: number
    percentage: number
    grade: string
    time_spent: number
    correct_answers: number
    wrong_answers: number
    unanswered?: number
    submitted_at: string
    rank?: number
    percentile?: number
    feedback?: string
    recommendations?: string[]
  }
  onDownload?: () => void
  onShare?: () => void
  onPrint?: () => void
  onViewDetails?: () => void
}

export function ResultCard({ 
  result, 
  onDownload, 
  onShare, 
  onPrint, 
  onViewDetails 
}: ResultCardProps) {
  
  const getGradeColor = () => {
    const grade = result.grade.toUpperCase()
    switch(grade) {
      case 'A': return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0'
      case 'B': return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0'
      case 'C': return 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0'
      case 'D': return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0'
      default: return 'bg-gradient-to-r from-red-500 to-rose-500 text-white border-0'
    }
  }

  const getPerformanceIcon = () => {
    if (result.percentage >= 80) return <Trophy className="h-8 w-8 text-yellow-500" />
    if (result.percentage >= 60) return <Star className="h-8 w-8 text-blue-500" />
    if (result.percentage >= 40) return <Target className="h-8 w-8 text-orange-500" />
    return <AlertCircle className="h-8 w-8 text-red-500" />
  }

  const getPerformanceTitle = () => {
    if (result.percentage >= 80) return "Outstanding Achievement!"
    if (result.percentage >= 60) return "Great Performance!"
    if (result.percentage >= 40) return "Good Effort!"
    return "Keep Working Hard!"
  }

  const getPerformanceMessage = () => {
    if (result.percentage >= 80) {
      return "Excellent! You've demonstrated outstanding understanding of the subject matter. Your dedication and hard work have paid off brilliantly!"
    }
    if (result.percentage >= 60) {
      return "Good job! You have a solid grasp of the concepts. With a little more practice, you can achieve even better results."
    }
    if (result.percentage >= 40) {
      return "Fair performance. You've shown understanding of the basics. Review the topics you struggled with and try again to improve your score."
    }
    return "Need improvement. Don't be discouraged! We recommend reviewing the course materials thoroughly and taking advantage of our additional resources before retaking the exam."
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`
    }
    return `${mins}m ${secs}s`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const unanswered = result.unanswered || (result.total - result.correct_answers - result.wrong_answers)
  const accuracy = (result.correct_answers / (result.correct_answers + result.wrong_answers)) * 100 || 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden shadow-2xl border-0">
        {/* Header with Gradient */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#0A2472] via-primary to-[#1e3a8a] p-6 text-white">
          <div className="absolute inset-0 bg-grid-pattern-white opacity-5" />
          <div className="relative z-10">
            <div className="flex flex-wrap justify-between items-start gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="h-5 w-5 text-yellow-400" />
                  <span className="text-sm font-medium text-white/80">Exam Result</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2">{result.exam_title}</h2>
                <p className="text-white/80 text-sm">Submitted on {formatDate(result.submitted_at)}</p>
              </div>
              <Badge className={`text-lg px-5 py-2.5 font-bold shadow-lg ${getGradeColor()}`}>
                Grade: {result.grade}
              </Badge>
            </div>
          </div>
        </div>
        
        <CardContent className="p-6 md:p-8">
          {/* Score Overview */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
              <div className="relative inline-flex items-center justify-center w-36 h-36 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border-4 border-primary/20">
                <div className="text-center">
                  <span className="text-4xl font-bold text-primary">{result.score}</span>
                  <span className="text-gray-500 text-lg">/{result.total}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-center gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{result.percentage}%</p>
                <p className="text-sm text-gray-500">Percentage Score</p>
              </div>
              {result.rank && (
                <div className="text-center px-4 border-l border-gray-200">
                  <p className="text-3xl font-bold text-secondary">#{result.rank}</p>
                  <p className="text-sm text-gray-500">Class Rank</p>
                </div>
              )}
              {result.percentile && (
                <div className="text-center px-4 border-l border-gray-200">
                  <p className="text-3xl font-bold text-accent">{result.percentile}%</p>
                  <p className="text-sm text-gray-500">Percentile</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100"
            >
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-700">{result.correct_answers}</p>
              <p className="text-xs text-green-600 font-medium">Correct Answers</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center p-4 bg-gradient-to-br from-red-50 to-rose-50 rounded-xl border border-red-100"
            >
              <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-700">{result.wrong_answers}</p>
              <p className="text-xs text-red-600 font-medium">Wrong Answers</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-100"
            >
              <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-700">{formatTime(result.time_spent)}</p>
              <p className="text-xs text-blue-600 font-medium">Time Spent</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100"
            >
              <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-700">{accuracy.toFixed(1)}%</p>
              <p className="text-xs text-purple-600 font-medium">Accuracy Rate</p>
            </motion.div>
          </div>
          
          {/* Performance Message with Icon */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={cn(
              "rounded-xl p-5 mb-6 border",
              result.percentage >= 80 ? "bg-green-50 border-green-200" :
              result.percentage >= 60 ? "bg-blue-50 border-blue-200" :
              result.percentage >= 40 ? "bg-yellow-50 border-yellow-200" :
              "bg-red-50 border-red-200"
            )}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                {getPerformanceIcon()}
              </div>
              <div className="flex-1">
                <h4 className={cn(
                  "font-bold text-lg mb-2",
                  result.percentage >= 80 ? "text-green-800" :
                  result.percentage >= 60 ? "text-blue-800" :
                  result.percentage >= 40 ? "text-yellow-800" :
                  "text-red-800"
                )}>
                  {getPerformanceTitle()}
                </h4>
                <p className={cn(
                  "text-sm leading-relaxed",
                  result.percentage >= 80 ? "text-green-700" :
                  result.percentage >= 60 ? "text-blue-700" :
                  result.percentage >= 40 ? "text-yellow-700" :
                  "text-red-700"
                )}>
                  {getPerformanceMessage()}
                </p>
              </div>
            </div>
          </motion.div>
          
          {/* Recommendations */}
          {result.recommendations && result.recommendations.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gray-50 rounded-xl p-5 mb-6 border border-gray-200"
            >
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-5 w-5 text-secondary" />
                <h4 className="font-semibold text-gray-800">Recommendations for Improvement</h4>
              </div>
              <ul className="space-y-2">
                {result.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-secondary mt-0.5">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
          
          {/* Action Buttons */}
          <div className="flex flex-wrap justify-end gap-3 pt-2">
            {onPrint && (
              <Button 
                variant="outline" 
                onClick={onPrint}
                className="gap-2"
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
            )}
            {onShare && (
              <Button 
                variant="outline" 
                onClick={onShare}
                className="gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            )}
            {onDownload && (
              <Button 
                variant="outline" 
                onClick={onDownload}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download Certificate
              </Button>
            )}
            {onViewDetails && (
              <Button 
                onClick={onViewDetails}
                className="bg-gradient-to-r from-primary to-[#1e3a8a] hover:from-primary/90 hover:to-[#1e3a8a]/90 gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                View Detailed Analysis
              </Button>
            )}
          </div>
          
          {/* Additional Info */}
          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              This result has been verified and certified by Vincollins College Academic Board.
              {result.grade === 'A' && " Congratulations on your outstanding achievement!"}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}