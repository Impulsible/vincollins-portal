// src/components/student/exams/ExamsHeader.tsx
import { Button } from '@/components/ui/button'
import { ChevronRight, Home, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { StudentProfile } from '@/app/student/exams/types'

interface ExamsHeaderProps {
  profile: StudentProfile | null
  stats: {
    termName: string
    sessionYear: string
  }
  onBackToDashboard: () => void
}

export function ExamsHeader({ profile, stats, onBackToDashboard }: ExamsHeaderProps) {
  return (
    <>
      {/* Breadcrumb Navigation */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link 
            href="/student" 
            className="hover:text-primary flex items-center gap-1 transition-colors"
          >
            <Home className="h-4 w-4" />
            <span className="hidden xs:inline">Dashboard</span>
          </Link>
          <ChevronRight className="h-3.5 w-3.5 hidden xs:block" />
          <span className="text-foreground font-medium">Exams</span>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onBackToDashboard} 
          className="w-full sm:w-auto"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      {/* Page Title */}
      <div className="mb-5 sm:mb-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
          Available Exams
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {profile?.class} • {profile?.department} • {stats.termName} {stats.sessionYear}
        </p>
      </div>
    </>
  )
}