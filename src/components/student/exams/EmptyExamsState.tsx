// src/components/student/exams/EmptyExamsState.tsx
import { Card, CardContent } from '@/components/ui/card'
import { MonitorPlay, Award, Clock } from 'lucide-react'
import type { TabType, StatsState } from '@/app/student/exams/types'

interface EmptyExamsStateProps {
  activeTab: TabType
  stats: StatsState
}

export function EmptyExamsState({ activeTab, stats }: EmptyExamsStateProps) {
  const config = {
    available: {
      icon: MonitorPlay,
      title: 'No exams available',
      description: `No exams available for ${stats.termName} ${stats.sessionYear}.`,
    },
    completed: {
      icon: Award,
      title: 'No completed exams',
      description: 'Complete available exams to see your results!',
    },
    upcoming: {
      icon: Clock,
      title: 'No upcoming exams',
      description: 'No upcoming exams scheduled.',
    },
  }

  const { icon: Icon, title, description } = config[activeTab] || config.available

  return (
    <div className="min-h-[50vh] flex items-center justify-center py-16 sm:py-20 lg:py-24">
      <Card className="border-0 shadow-lg bg-card max-w-md w-full mx-auto">
        <CardContent className="text-center py-12 sm:py-16 px-6">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Icon className="h-8 w-8 text-muted-foreground/60" />
          </div>
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-muted-foreground text-sm sm:text-base">
            {description}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}