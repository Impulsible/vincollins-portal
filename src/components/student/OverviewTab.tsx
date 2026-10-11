/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { motion } from 'framer-motion'
import { StudentWelcomeBanner } from '@/components/student/StudentWelcomeBanner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ArrowRight, BarChart3, MonitorPlay, Trophy, XCircle, ChevronRight, FileCheck, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RecentActivityCard } from './RecentActivityCard'
import { ClassmatesPreviewCard } from './ClassmatesPreviewCard'
import { AssignmentsPreviewCard } from './AssignmentsPreviewCard'
import { NotesPreviewCard } from './NotesPreviewCard'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
}

interface OverviewTabProps {
  profile: any
  stats: any
  bannerStats: any
  reportCardStatus: any
  welcomeBannerProfile: any
  handleTabChange: (tab: string) => void
  router: any
}

export function OverviewTab({ 
  profile, 
  stats, 
  bannerStats, 
  reportCardStatus, 
  welcomeBannerProfile,
  handleTabChange,
  router 
}: OverviewTabProps) {
  
  // Add null safety for all stats arrays
  const safeStats = {
    ...stats,
    availableExams: stats?.availableExams || [],
    recentAttempts: stats?.recentAttempts || [],
    allAttempts: stats?.allAttempts || [],
    classmates: stats?.classmates || [],
    recentAssignments: stats?.recentAssignments || [],
    allAssignments: stats?.allAssignments || [],
    recentNotes: stats?.recentNotes || [],
    allNotes: stats?.allNotes || [],
    completedExams: stats?.completedExams || 0,
    passedExams: stats?.passedExams || 0,
    failedExams: stats?.failedExams || 0,
  }
  
  // Helper to check if exam has an attempt
  const getExamAttempt = (examId: string) => {
    return (safeStats.allAttempts || []).find((a: any) => a.exam_id === examId)
  }
  
  const getStatusBadge = (status: string, isPassed?: boolean) => {
    switch (status) {
      case 'completed':
      case 'graded':
        return (
          <Badge className={cn(
            "text-xs shrink-0 border", 
            isPassed 
              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' 
              : 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
          )}>
            {isPassed ? 'Passed' : 'Failed'}
          </Badge>
        )
      case 'pending_theory':
      case 'submitted':
        return (
          <Badge className="bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs shrink-0 border-amber-200 dark:border-amber-800">
            Pending
          </Badge>
        )
      case 'in_progress':
        return (
          <Badge className="bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs shrink-0 border-blue-200 dark:border-blue-800">
            In Progress
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-xs shrink-0 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
            {status}
          </Badge>
        )
    }
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 70) return 'text-emerald-600 dark:text-emerald-400'
    if (percentage >= 50) return 'text-amber-600 dark:text-amber-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getReportCardStatusBadge = (status: string | null) => {
    if (!status) return null
    switch (status) {
      case 'published': 
        return <Badge className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shrink-0 border border-emerald-200 dark:border-emerald-800">Published</Badge>
      case 'approved': 
        return <Badge className="bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 shrink-0 border border-blue-200 dark:border-blue-800">Approved</Badge>
      case 'pending': 
        return <Badge className="bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 shrink-0 border border-amber-200 dark:border-amber-800">Pending</Badge>
      case 'rejected': 
        return <Badge className="bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 shrink-0 border border-red-200 dark:border-red-800">Rejected</Badge>
      default: 
        return null
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const handleDownloadFile = async (fileUrl: string, title: string) => {
    if (!fileUrl) return
    try {
      window.open(fileUrl, '_blank')
    } catch (error) {
      console.error('Error opening file:', error)
    }
  }

  const handleTakeExam = (examId: string) => router.push(`/student/exam/${examId}`)

  return (
    <motion.div 
      key="overview"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8 sm:space-y-10 md:space-y-12 lg:space-y-14 w-full overflow-hidden py-4 sm:py-6"
    >
      {/* Welcome Banner */}
      <motion.div variants={itemVariants} className="w-full overflow-hidden">
        <StudentWelcomeBanner 
          profile={welcomeBannerProfile} 
          stats={bannerStats}
        />
      </motion.div>

      {/* Report Card Status Banner */}
      {reportCardStatus && (
        <motion.div variants={itemVariants} className="w-full overflow-hidden">
          <Card 
            className={cn(
              "border shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden rounded-2xl",
              reportCardStatus.status === 'published' 
                ? "bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-800/60 border-l-4 border-l-emerald-500"
                : reportCardStatus.status === 'approved'
                ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800/60 border-l-4 border-l-blue-500"
                : reportCardStatus.status === 'pending'
                ? "bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20 border-amber-200 dark:border-amber-800/60 border-l-4 border-l-amber-500"
                : "bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/20 border-red-200 dark:border-red-800/60 border-l-4 border-l-red-500"
            )}
            onClick={() => handleTabChange('report-card')}
          >
            <CardContent className="p-5 sm:p-6 lg:p-7">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 sm:gap-5 min-w-0 flex-1">
                  <div className={cn(
                    "h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                    reportCardStatus.status === 'published' ? "bg-emerald-100 dark:bg-emerald-950/60" :
                    reportCardStatus.status === 'approved' ? "bg-blue-100 dark:bg-blue-950/60" :
                    reportCardStatus.status === 'pending' ? "bg-amber-100 dark:bg-amber-950/60" : "bg-red-100 dark:bg-red-950/60"
                  )}>
                    <FileCheck className={cn(
                      "h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8",
                      reportCardStatus.status === 'published' ? "text-emerald-600 dark:text-emerald-400" :
                      reportCardStatus.status === 'approved' ? "text-blue-600 dark:text-blue-400" :
                      reportCardStatus.status === 'pending' ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"
                    )} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base lg:text-lg truncate">
                        {reportCardStatus.term} {reportCardStatus.academic_year} Report Card
                      </h3>
                      {getReportCardStatusBadge(reportCardStatus.status)}
                    </div>
                    {reportCardStatus.average_score && (
                      <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
                        Average Score: <span className="font-bold text-slate-900 dark:text-white">{reportCardStatus.average_score}%</span>
                      </p>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 text-slate-400 dark:text-slate-500 shrink-0" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Main Grid: Performance + Exams | Recent Activity */}
      <motion.div variants={itemVariants} className="w-full overflow-hidden">
        <div className="grid gap-6 sm:gap-8 lg:gap-10 grid-cols-1 lg:grid-cols-3">
          {/* Left Column - Performance & Exams */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8 lg:space-y-10 w-full overflow-hidden">
            
            {/* Performance Overview - Only show if exams completed */}
            {safeStats.completedExams > 0 && (
              <Card className="border border-slate-200 dark:border-slate-800 shadow-md bg-white dark:bg-slate-900 overflow-hidden w-full rounded-2xl transition-colors duration-300">
                <CardHeader className="pb-4 sm:pb-5 lg:pb-6 px-5 sm:px-6 lg:px-7 pt-5 sm:pt-6 lg:pt-7">
                  <CardTitle className="text-base sm:text-lg lg:text-xl flex items-center gap-3 text-slate-800 dark:text-slate-100">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-950/50 rounded-lg">
                      <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    </div>
                    Performance Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 sm:px-6 lg:px-7 pb-5 sm:pb-6 lg:pb-7">
                  <div className="space-y-5 sm:space-y-6 lg:space-y-7">
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between text-sm sm:text-base mb-3">
                        <span className="text-slate-600 dark:text-slate-300 font-medium">Pass Rate</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {safeStats.completedExams > 0 ? Math.round((safeStats.passedExams / safeStats.completedExams) * 100) : 0}%
                        </span>
                      </div>
                      <Progress 
                        value={safeStats.completedExams > 0 ? (safeStats.passedExams / safeStats.completedExams) * 100 : 0} 
                        className="h-3 bg-slate-200 dark:bg-slate-700" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4 sm:gap-5 text-center">
                      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 rounded-xl p-5 sm:p-6 lg:p-7 border border-emerald-100 dark:border-emerald-900/40">
                        <div className="bg-emerald-100 dark:bg-emerald-950/60 rounded-full p-3 w-fit mx-auto mb-3">
                          <Trophy className="h-6 w-6 sm:h-7 sm:w-7 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-emerald-700 dark:text-emerald-400 mb-1">{safeStats.passedExams}</p>
                        <p className="text-sm sm:text-base text-emerald-600 dark:text-emerald-300 font-medium">Passed Exams</p>
                      </div>
                      <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/20 rounded-xl p-5 sm:p-6 lg:p-7 border border-red-100 dark:border-red-900/40">
                        <div className="bg-red-100 dark:bg-red-950/60 rounded-full p-3 w-fit mx-auto mb-3">
                          <XCircle className="h-6 w-6 sm:h-7 sm:w-7 text-red-600 dark:text-red-400" />
                        </div>
                        <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-red-700 dark:text-red-400 mb-1">{safeStats.failedExams}</p>
                        <p className="text-sm sm:text-base text-red-600 dark:text-red-300 font-medium">Failed Exams</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Available Exams */}
            <Card className="border border-slate-200 dark:border-slate-800 shadow-md bg-white dark:bg-slate-900 overflow-hidden w-full rounded-2xl transition-colors duration-300">
              <CardHeader className="pb-4 sm:pb-5 lg:pb-6 px-5 sm:px-6 lg:px-7 pt-5 sm:pt-6 lg:pt-7">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base sm:text-lg lg:text-xl flex items-center gap-3 text-slate-800 dark:text-slate-100">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-950/50 rounded-lg">
                      <MonitorPlay className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    </div>
                    Available Exams
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs sm:text-sm font-medium cursor-pointer"
                    onClick={() => router.push('/student/exams')}
                  >
                    View All <ArrowRight className="ml-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-5 sm:px-6 lg:px-7 pb-5 sm:pb-6 lg:pb-7">
                {safeStats.availableExams.length === 0 ? (
                  <div className="text-center py-10 sm:py-12 lg:py-14">
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-full p-4 w-fit mx-auto mb-4">
                      <MonitorPlay className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400 dark:text-slate-500" />
                    </div>
                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium">No exams available for your class</p>
                    <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 mt-1">Check back later for new exams</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {safeStats.availableExams.slice(0, 3).map((exam: any) => {
                      const attempt = getExamAttempt(exam.id)
                      const isInProgress = attempt?.status === 'in_progress'
                      return (
                        <div 
                          key={exam.id} 
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-200 border border-slate-100 dark:border-slate-800"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <p className="font-semibold text-sm sm:text-base text-slate-800 dark:text-slate-100">{exam.title}</p>
                              {isInProgress && (
                                <Badge className="bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs">Resume</Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className="text-xs font-medium border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">{exam.subject}</Badge>
                              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <span className="inline-block w-1 h-1 bg-slate-400 dark:bg-slate-500 rounded-full"></span>
                                {exam.duration} mins
                              </span>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => handleTakeExam(exam.id)} 
                            className={cn(
                              "shrink-0 w-full sm:w-auto px-6 cursor-pointer text-white shadow-sm",
                              isInProgress 
                                ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500" 
                                : "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                            )}
                          >
                            {isInProgress ? (
                              <><RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Resume Exam</>
                            ) : (
                              'Start Exam'
                            )}
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Recent Activity */}
          <div className="space-y-6 sm:space-y-8 lg:space-y-10 w-full overflow-hidden">
            <RecentActivityCard 
              attempts={safeStats.recentAttempts}
              getStatusBadge={getStatusBadge}
              getScoreColor={getScoreColor}
            />
          </div>
        </div>
      </motion.div>

      {/* Classmates Preview */}
      <motion.div variants={itemVariants} className="w-full overflow-hidden">
        <ClassmatesPreviewCard 
          classmates={safeStats.classmates}
          studentClass={profile?.class || ''}
          onViewAll={() => handleTabChange('classmates')}
        />
      </motion.div>

      {/* Assignments Preview */}
      <motion.div variants={itemVariants} className="w-full overflow-hidden">
        <AssignmentsPreviewCard 
          assignments={safeStats.recentAssignments}
          allAssignmentsCount={safeStats.allAssignments.length}
          onDownload={handleDownloadFile}
          formatDate={formatDate}
        />
      </motion.div>

      {/* Notes Preview */}
      <motion.div variants={itemVariants} className="w-full overflow-hidden">
        <NotesPreviewCard 
          notes={safeStats.recentNotes}
          allNotesCount={safeStats.allNotes.length}
          onDownload={handleDownloadFile}
          formatDate={formatDate}
        />
      </motion.div>
    </motion.div>
  )
}