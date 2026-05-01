import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Activity, ArrowRight, Trophy, Clock, CheckCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RecentActivityCardProps {
  attempts: any[]
  getStatusBadge: (status: string, isPassed?: boolean) => React.ReactNode
  getScoreColor: (percentage: number) => string
}

export function RecentActivityCard({ attempts, getStatusBadge, getScoreColor }: RecentActivityCardProps) {
  const router = useRouter()

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden w-full rounded-2xl">
      <CardHeader className="pb-3 px-5 pt-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <Activity className="h-4 w-4 text-blue-600" />
            </div>
            Recent Activity
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => router.push('/student/exams')}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs font-medium">
            View All <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {attempts.length === 0 ? (
          <div className="text-center py-8">
            <div className="bg-slate-100 rounded-full p-3 w-fit mx-auto mb-3">
              <Activity className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600">No recent activity</p>
            <p className="text-xs text-slate-400 mt-1">Your exam history will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {attempts.slice(0, 5).map((attempt, index) => {
              const isInProgress = attempt.status === 'in_progress'
              return (
                <div 
                  key={attempt.id || index} 
                  className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 transition-colors cursor-pointer"
                  onClick={() => {
                    // ✅ Fixed: In-progress goes to exam, completed goes to results
                    if (isInProgress) {
                      router.push(`/student/exam/${attempt.exam_id}`)
                    } else {
                      router.push(`/student/results/${attempt.exam_id}`)
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-800 truncate">
                        {attempt.exam_title || 'Exam'}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {attempt.exam_subject || 'Unknown Subject'}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {isInProgress ? (
                        <Badge className="bg-blue-100 text-blue-700 text-xs border-blue-200">
                          <RefreshCw className="h-3 w-3 mr-1" /> In Progress
                        </Badge>
                      ) : (
                        getStatusBadge(attempt.status, attempt.is_passed)
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      {!isInProgress && (
                        <span className="flex items-center gap-1">
                          <Trophy className="h-3 w-3" />
                          <span className={cn("font-bold", getScoreColor(attempt.percentage || 0))}>
                            {attempt.percentage || 0}%
                          </span>
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(attempt.submitted_at || attempt.started_at || attempt.created_at)}
                      </span>
                      {!isInProgress && attempt.correct_count !== undefined && (
                        <span className="flex items-center gap-1 text-emerald-600">
                          <CheckCircle className="h-3 w-3" />
                          {attempt.correct_count}
                        </span>
                      )}
                    </div>
                    {isInProgress && (
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-blue-600">
                        <RefreshCw className="h-3 w-3 mr-1" /> Resume
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}