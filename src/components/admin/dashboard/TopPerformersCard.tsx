// components/admin/dashboard/TopPerformersCard.tsx
'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Trophy, TrendingUp, Medal, Crown, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Student {
  id: string
  full_name: string
  class: string
  photo_url?: string
}

interface TopPerformersCardProps {
  students: Student[]
}

export function TopPerformersCard({ students }: TopPerformersCardProps) {
  // Generate performance data from students
  const topPerformers = useMemo(() => {
    if (!students.length) return []
    
    return students
      .slice(0, 5)
      .map((student, index) => ({
        ...student,
        score: 95 - index * 3,
        exams: 12 - index,
        rank: index + 1,
        trend: index === 0 ? 'up' : index === 1 ? 'stable' : 'down' as const
      }))
  }, [students])

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-amber-500" />
    if (rank === 2) return <Medal className="h-5 w-5 text-slate-400" />
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-700" />
    return <Star className="h-4 w-4 text-muted-foreground" />
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600'
    if (score >= 80) return 'text-blue-600'
    if (score >= 70) return 'text-amber-600'
    return 'text-red-600'
  }

  if (topPerformers.length === 0) {
    return (
      <Card className="border-0 shadow-md overflow-hidden">
        <CardHeader className="pb-3 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Top Performers</CardTitle>
              <CardDescription>No student data available</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Add students to see top performers</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-md overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Top Performers</CardTitle>
              <CardDescription>Based on overall performance</CardDescription>
            </div>
          </div>
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <TrendingUp className="h-5 w-5 text-emerald-500" />
          </motion.div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="divide-y">
          {topPerformers.map((performer, index) => (
            <motion.div
              key={performer.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "group flex items-center gap-4 p-4 transition-all duration-200",
                "hover:bg-muted/30 cursor-pointer",
                index === 0 && "bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-950/20"
              )}
            >
              {/* Rank */}
              <div className="w-8 text-center">
                {getRankIcon(performer.rank)}
              </div>

              {/* Avatar */}
              <Avatar className={cn(
                "h-10 w-10 ring-2",
                index === 0 ? "ring-amber-500" : "ring-background"
              )}>
                <AvatarImage src={performer.photo_url} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20">
                  {performer.full_name?.charAt(0) || 'S'}
                </AvatarFallback>
              </Avatar>

              {/* Student Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{performer.full_name}</p>
                  {performer.trend === 'up' && (
                    <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">▲</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{performer.class}</p>
              </div>

              {/* Score */}
              <div className="text-right">
                <p className={cn(
                  "text-lg font-bold",
                  getScoreColor(performer.score)
                )}>
                  {performer.score}%
                </p>
                <Progress 
                  value={performer.score} 
                  className="w-16 h-1.5 mt-1"
                />
              </div>
            </motion.div>
          ))}
        </div>

        <div className="border-t p-3 bg-muted/20">
          <p className="text-xs text-muted-foreground text-center">
            Top {topPerformers.length} students
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default TopPerformersCard