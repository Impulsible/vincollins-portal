import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Activity, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// ✅ FIXED: Import from the correct location
import { ExamAttempt } from '@/app/student/types'

interface RecentActivityCardProps {
  attempts: ExamAttempt[]
  getStatusBadge: (status: string, isPassed?: boolean) => React.ReactNode
  getScoreColor: (percentage: number) => string
}

export function RecentActivityCard({ attempts, getStatusBadge, getScoreColor }: RecentActivityCardProps) {
  const router = useRouter()

  return (
    <Card className="border-0 shadow-sm bg-white overflow-hidden w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-600 shrink-0" />
            Recent Activity
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push('/student/results')}
          >
            View All <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {attempts.length === 0 ? (
          <p className="text-center py-6 text-slate-500 text-sm">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {attempts.slice(0, 4).map((attempt) => (
              <div key={attempt.id} className="p-3 bg-slate-50 rounded-xl">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-medium text-sm break-words flex-1">{attempt.exam_title}</p>
                  {getStatusBadge(attempt.status, attempt.is_passed)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{attempt.exam_subject}</span>
                  <span className={cn("font-medium text-sm", getScoreColor(attempt.percentage))}>
                    {attempt.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}