import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, ArrowLeft, Award, Eye, CheckCircle, XCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ResultsTabProps {
  stats: any
  handleTabChange: (tab: string) => void
  router: any
}

export function ResultsTab({ stats, handleTabChange, router }: ResultsTabProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const getStatusBadge = (status: string, isPassed?: boolean) => {
    switch (status) {
      case 'completed':
      case 'graded':
        return (
          <Badge className={cn("text-xs shrink-0", isPassed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
            {isPassed ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
            {isPassed ? 'Passed' : 'Failed'}
          </Badge>
        )
      case 'pending_theory':
      case 'submitted':
        return <Badge className="bg-yellow-100 text-yellow-700 text-xs shrink-0"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      default:
        return <Badge variant="outline" className="text-xs shrink-0">{status}</Badge>
    }
  }

  const filteredAttempts = stats.recentAttempts.filter((attempt: any) => 
    attempt.exam_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    attempt.exam_subject?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleViewResult = (attemptId: string) => router.push(`/student/results/${attemptId}`)

  return (
    <motion.div 
      key="results" 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0 }} 
      className="w-full overflow-hidden"
    >
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl sm:text-2xl font-bold">My Results</h1>
        <Button variant="outline" size="sm" onClick={() => handleTabChange('overview')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Overview
        </Button>
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <Badge className="bg-emerald-100 text-emerald-700 w-fit">
          {stats.completedExams} completed
        </Badge>
      </div>
      
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search results..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white w-full"
          />
        </div>
      </div>
      
      <Card className="overflow-hidden">
        <CardContent className="p-4 sm:p-6">
          {filteredAttempts.length === 0 ? (
            <div className="text-center py-8">
              <Award className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500">No exam results yet.</p>
              <Button variant="link" onClick={() => handleTabChange('exams')}>
                Browse available exams
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {filteredAttempts.map((attempt: any) => (
                <div key={attempt.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium break-words">{attempt.exam_title}</h4>
                      <p className="text-sm text-slate-500">{attempt.exam_subject}</p>
                      <p className="text-sm">Score: {attempt.total_score || 0} ({attempt.percentage}%)</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {getStatusBadge(attempt.status, attempt.is_passed)}
                      <Button variant="outline" size="sm" onClick={() => handleViewResult(attempt.id)}>
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}