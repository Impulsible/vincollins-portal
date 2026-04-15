// components/student/RecentResultsList.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GraduationCap } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Result {
  id: string
  exam_title: string
  score: number
  total_marks: number
  percentage: number
  is_passed: boolean
  completed_at: string
}

interface RecentResultsListProps {
  results: Result[]
}

export function RecentResultsList({ results }: RecentResultsListProps) {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          Recent Results
        </CardTitle>
        <CardDescription>Your latest exam performances</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {results.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No results yet. Take an exam to see your scores!
          </p>
        ) : (
          results.slice(0, 5).map((result) => (
            <div key={result.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{result.exam_title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(result.completed_at), { addSuffix: true })}
                  </p>
                </div>
                <Badge className={
                  result.is_passed
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }>
                  {result.is_passed ? 'Passed' : 'Failed'}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-2 text-sm">
                <span className="text-muted-foreground">
                  Score: {result.score}/{result.total_marks}
                </span>
                <span className={result.percentage >= 50 ? 'text-green-600' : 'text-red-600'}>
                  {Math.round(result.percentage)}%
                </span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}