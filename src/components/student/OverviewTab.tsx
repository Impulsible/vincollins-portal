import { motion } from 'framer-motion'
import { StudentWelcomeBanner } from '@/components/student/StudentWelcomeBanner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ArrowRight, BarChart3, MonitorPlay, Trophy, XCircle, ChevronRight, FileCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RecentActivityCard } from './RecentActivityCard'
import { ClassmatesPreviewCard } from './ClassmatesPreviewCard'
import { AssignmentsPreviewCard } from './AssignmentsPreviewCard'
import { NotesPreviewCard } from './NotesPreviewCard'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
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
  
  const getStatusBadge = (status: string, isPassed?: boolean) => {
    switch (status) {
      case 'completed':
      case 'graded':
        return (
          <Badge className={cn("text-xs shrink-0", isPassed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
            {isPassed ? 'Passed' : 'Failed'}
          </Badge>
        )
      case 'pending_theory':
      case 'submitted':
        return <Badge className="bg-yellow-100 text-yellow-700 text-xs shrink-0">Pending</Badge>
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
      case 'published': return <Badge className="bg-green-100 text-green-700 shrink-0">Published</Badge>
      case 'approved': return <Badge className="bg-blue-100 text-blue-700 shrink-0">Approved</Badge>
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-700 shrink-0">Pending</Badge>
      case 'rejected': return <Badge className="bg-red-100 text-red-700 shrink-0">Rejected</Badge>
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
      className="space-y-4 sm:space-y-6 w-full overflow-hidden"
    >
      <motion.div variants={itemVariants} className="w-full overflow-hidden">
        <StudentWelcomeBanner 
          profile={welcomeBannerProfile} 
          stats={bannerStats}
        />
      </motion.div>

      {reportCardStatus && (
        <motion.div variants={itemVariants} className="w-full overflow-hidden">
          <Card 
            className={cn(
              "border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden",
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
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  <div className={cn(
                    "h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center shrink-0",
                    reportCardStatus.status === 'published' ? "bg-green-100" :
                    reportCardStatus.status === 'approved' ? "bg-blue-100" :
                    reportCardStatus.status === 'pending' ? "bg-yellow-100" : "bg-red-100"
                  )}>
                    <FileCheck className={cn(
                      "h-5 w-5 sm:h-6 sm:w-6",
                      reportCardStatus.status === 'published' ? "text-green-600" :
                      reportCardStatus.status === 'approved' ? "text-blue-600" :
                      reportCardStatus.status === 'pending' ? "text-yellow-600" : "text-red-600"
                    )} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                        {reportCardStatus.term} {reportCardStatus.academic_year} Report Card
                      </h3>
                      {getReportCardStatusBadge(reportCardStatus.status)}
                    </div>
                    {reportCardStatus.average_score && (
                      <p className="text-xs sm:text-sm text-slate-600 mt-1">
                        Average Score: <span className="font-bold">{reportCardStatus.average_score}%</span>
                      </p>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400 shrink-0" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div variants={itemVariants} className="w-full overflow-hidden">
        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6 w-full overflow-hidden">
            {stats.completedExams > 0 && (
              <Card className="border-0 shadow-sm bg-white overflow-hidden w-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-emerald-600 shrink-0" />
                    Performance Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Pass Rate</span>
                        <span>{stats.completedExams > 0 ? Math.round((stats.passedExams / stats.completedExams) * 100) : 0}%</span>
                      </div>
                      <Progress value={stats.completedExams > 0 ? (stats.passedExams / stats.completedExams) * 100 : 0} className="h-2" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4">
                        <Trophy className="h-5 w-5 text-green-600 mx-auto mb-2" />
                        <p className="text-3xl font-bold text-green-700">{stats.passedExams}</p>
                        <p className="text-sm text-green-600">Passed</p>
                      </div>
                      <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-4">
                        <XCircle className="h-5 w-5 text-red-600 mx-auto mb-2" />
                        <p className="text-3xl font-bold text-red-700">{stats.failedExams}</p>
                        <p className="text-sm text-red-600">Failed</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-0 shadow-sm bg-white overflow-hidden w-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <MonitorPlay className="h-5 w-5 text-emerald-600 shrink-0" />
                    Available Exams
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => handleTabChange('exams')}>
                    View All <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {stats.availableExams.length === 0 ? (
                  <p className="text-center py-6 text-slate-500 text-sm">No exams available</p>
                ) : (
                  <div className="space-y-3">
                    {stats.availableExams.slice(0, 3).map((exam: any) => (
                      <div key={exam.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm break-words">{exam.title}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">{exam.subject}</Badge>
                            <span className="text-xs text-slate-500">{exam.duration} mins</span>
                          </div>
                        </div>
                        <Button size="sm" onClick={() => handleTakeExam(exam.id)} className="bg-emerald-600 shrink-0 w-full sm:w-auto">
                          Start
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4 sm:space-y-6 w-full overflow-hidden">
            <RecentActivityCard 
              attempts={stats.recentAttempts}
              getStatusBadge={getStatusBadge}
              getScoreColor={getScoreColor}
            />
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="w-full overflow-hidden">
        <ClassmatesPreviewCard 
          classmates={stats.classmates}
          studentClass={profile?.class || ''}
          onViewAll={() => handleTabChange('classmates')}
        />
      </motion.div>

      <motion.div variants={itemVariants} className="w-full overflow-hidden">
        <AssignmentsPreviewCard 
          assignments={stats.recentAssignments}
          allAssignmentsCount={stats.allAssignments.length}
          onDownload={handleDownloadFile}
          formatDate={formatDate}
        />
      </motion.div>

      <motion.div variants={itemVariants} className="w-full overflow-hidden">
        <NotesPreviewCard 
          notes={stats.recentNotes}
          allNotesCount={stats.allNotes.length}
          onDownload={handleDownloadFile}
          formatDate={formatDate}
        />
      </motion.div>
    </motion.div>
  )
}