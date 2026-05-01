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
          <Badge className={cn("text-xs shrink-0", isPassed ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200')}>
            {isPassed ? 'Passed' : 'Failed'}
          </Badge>
        )
      case 'pending_theory':
      case 'submitted':
        return <Badge className="bg-yellow-100 text-yellow-700 text-xs shrink-0 border-yellow-200">Pending</Badge>
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-700 text-xs shrink-0 border-blue-200">In Progress</Badge>
      default:
        return <Badge variant="outline" className="text-xs shrink-0">{status}</Badge>
    }
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 70) return 'text-green-600'
    if (percentage >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getReportCardStatusBadge = (status: string | null) => {
    if (!status) return null
    switch (status) {
      case 'published': return <Badge className="bg-green-100 text-green-700 shrink-0 border-green-200">Published</Badge>
      case 'approved': return <Badge className="bg-blue-100 text-blue-700 shrink-0 border-blue-200">Approved</Badge>
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-700 shrink-0 border-yellow-200">Pending</Badge>
      case 'rejected': return <Badge className="bg-red-100 text-red-700 shrink-0 border-red-200">Rejected</Badge>
      default: return null
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

      {/* Report Card Status */}
      {reportCardStatus && (
        <motion.div variants={itemVariants} className="w-full overflow-hidden">
          <Card 
            className={cn(
              "border-0 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden",
              reportCardStatus.status === 'published' 
                ? "bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-l-green-500"
                : reportCardStatus.status === 'approved'
                ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-500"
                : reportCardStatus.status === 'pending'
                ? "bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-l-yellow-500"
                : "bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-l-red-500"
            )}
            onClick={() => handleTabChange('report-card')}
          >
            <CardContent className="p-5 sm:p-6 lg:p-7">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 sm:gap-5 min-w-0 flex-1">
                  <div className={cn(
                    "h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 rounded-xl flex items-center justify-center shrink-0",
                    reportCardStatus.status === 'published' ? "bg-green-100" :
                    reportCardStatus.status === 'approved' ? "bg-blue-100" :
                    reportCardStatus.status === 'pending' ? "bg-yellow-100" : "bg-red-100"
                  )}>
                    <FileCheck className={cn(
                      "h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8",
                      reportCardStatus.status === 'published' ? "text-green-600" :
                      reportCardStatus.status === 'approved' ? "text-blue-600" :
                      reportCardStatus.status === 'pending' ? "text-yellow-600" : "text-red-600"
                    )} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base lg:text-lg truncate">
                        {reportCardStatus.term} {reportCardStatus.academic_year} Report Card
                      </h3>
                      {getReportCardStatusBadge(reportCardStatus.status)}
                    </div>
                    {reportCardStatus.average_score && (
                      <p className="text-sm sm:text-base text-slate-600">
                        Average Score: <span className="font-bold">{reportCardStatus.average_score}%</span>
                      </p>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 text-slate-400 shrink-0" />
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
              <Card className="border-0 shadow-md bg-white overflow-hidden w-full">
                <CardHeader className="pb-4 sm:pb-5 lg:pb-6 px-5 sm:px-6 lg:px-7 pt-5 sm:pt-6 lg:pt-7">
                  <CardTitle className="text-base sm:text-lg lg:text-xl flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 shrink-0" />
                    </div>
                    Performance Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 sm:px-6 lg:px-7 pb-5 sm:pb-6 lg:pb-7">
                  <div className="space-y-5 sm:space-y-6 lg:space-y-7">
                    <div className="bg-slate-50 rounded-xl p-4 sm:p-5">
                      <div className="flex justify-between text-sm sm:text-base mb-3">
                        <span className="text-slate-600 font-medium">Pass Rate</span>
                        <span className="font-bold">{safeStats.completedExams > 0 ? Math.round((safeStats.passedExams / safeStats.completedExams) * 100) : 0}%</span>
                      </div>
                      <Progress 
                        value={safeStats.completedExams > 0 ? (safeStats.passedExams / safeStats.completedExams) * 100 : 0} 
                        className="h-3" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4 sm:gap-5 text-center">
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 sm:p-6 lg:p-7 border border-green-100">
                        <div className="bg-green-100 rounded-full p-3 w-fit mx-auto mb-3">
                          <Trophy className="h-6 w-6 sm:h-7 sm:w-7 text-green-600" />
                        </div>
                        <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-green-700 mb-1">{safeStats.passedExams}</p>
                        <p className="text-sm sm:text-base text-green-600 font-medium">Passed Exams</p>
                      </div>
                      <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-5 sm:p-6 lg:p-7 border border-red-100">
                        <div className="bg-red-100 rounded-full p-3 w-fit mx-auto mb-3">
                          <XCircle className="h-6 w-6 sm:h-7 sm:w-7 text-red-600" />
                        </div>
                        <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-red-700 mb-1">{safeStats.failedExams}</p>
                        <p className="text-sm sm:text-base text-red-600 font-medium">Failed Exams</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Available Exams */}
            <Card className="border-0 shadow-md bg-white overflow-hidden w-full">
              <CardHeader className="pb-4 sm:pb-5 lg:pb-6 px-5 sm:px-6 lg:px-7 pt-5 sm:pt-6 lg:pt-7">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base sm:text-lg lg:text-xl flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <MonitorPlay className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 shrink-0" />
                    </div>
                    Available Exams
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 text-xs sm:text-sm font-medium"
                    onClick={() => router.push('/student/exams')}
                  >
                    View All <ArrowRight className="ml-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-5 sm:px-6 lg:px-7 pb-5 sm:pb-6 lg:pb-7">
                {safeStats.availableExams.length === 0 ? (
                  <div className="text-center py-10 sm:py-12 lg:py-14">
                    <div className="bg-slate-100 rounded-full p-4 w-fit mx-auto mb-4">
                      <MonitorPlay className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400" />
                    </div>
                    <p className="text-sm sm:text-base text-slate-500 font-medium">No exams available for your class</p>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">Check back later for new exams</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {safeStats.availableExams.slice(0, 3).map((exam: any) => {
                      const attempt = getExamAttempt(exam.id)
                      const isInProgress = attempt?.status === 'in_progress'
                      return (
                        <div 
                          key={exam.id} 
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all duration-200 border border-transparent hover:border-slate-200"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <p className="font-medium text-sm sm:text-base">{exam.title}</p>
                              {isInProgress && (
                                <Badge className="bg-blue-100 text-blue-700 text-xs">Resume</Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className="text-xs font-medium">{exam.subject}</Badge>
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <span className="inline-block w-1 h-1 bg-slate-400 rounded-full"></span>
                                {exam.duration} mins
                              </span>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => handleTakeExam(exam.id)} 
                            className={cn(
                              "shrink-0 w-full sm:w-auto px-6",
                              isInProgress ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-600 hover:bg-emerald-700"
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