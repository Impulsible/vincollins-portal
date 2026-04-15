/* eslint-disable @typescript-eslint/no-unused-vars */
// components/staff/StaffStatsCards.tsx
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { BookOpen, FileText, Users, Notebook, CheckCircle, Clock } from 'lucide-react'

interface StaffStatsCardsProps {
  stats: {
    totalExams: number
    publishedExams: number
    totalAssignments: number
    totalNotes: number
    totalStudents: number
    pendingSubmissions: number
  }
}

export function StaffStatsCards({ stats }: StaffStatsCardsProps) {
  const cards = [
    {
      title: 'Total Exams',
      value: stats.totalExams,
      subValue: `${stats.publishedExams} published`,
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Assignments',
      value: stats.totalAssignments,
      icon: FileText,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      title: 'Study Notes',
      value: stats.totalNotes,
      icon: Notebook,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Students',
      value: stats.totalStudents,
      icon: Users,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    }
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <Card key={index} className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                {card.subValue && <p className="text-xs text-muted-foreground mt-1">{card.subValue}</p>}
              </div>
              <div className={`p-3 rounded-xl ${card.bgColor}`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}