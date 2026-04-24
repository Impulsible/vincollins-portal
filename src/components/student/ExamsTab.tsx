import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, ArrowLeft, MonitorPlay, ChevronRight, Clock, FileText, Award } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExamsTabProps {
  stats: any
  bannerStats: any
  handleTabChange: (tab: string) => void
  router: any
}

export function ExamsTab({ stats, bannerStats, handleTabChange, router }: ExamsTabProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredExams = stats.availableExams.filter((exam: any) => 
    exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exam.subject.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleTakeExam = (examId: string) => router.push(`/student/exam/${examId}`)

  return (
    <motion.div 
      key="exams" 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0 }} 
      className="w-full overflow-hidden space-y-4 sm:space-y-6"
    >
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2 sm:mb-4">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold">Available Exams</h1>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => handleTabChange('overview')}
          className="h-8 sm:h-9 text-xs sm:text-sm w-full sm:w-auto"
        >
          <ArrowLeft className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
          Back to Overview
        </Button>
      </div>
      
      {/* Stats Badge - Responsive */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Badge className="bg-emerald-100 text-emerald-700 text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1">
          <MonitorPlay className="h-3 w-3 mr-1" />
          {stats.availableExams.length} available exam{stats.availableExams.length !== 1 ? 's' : ''}
        </Badge>
        {bannerStats?.currentTerm && (
          <Badge variant="outline" className="text-[10px] sm:text-xs">
            {bannerStats.currentTerm}
          </Badge>
        )}
      </div>
      
      {/* Search Bar - Responsive */}
      <div className="relative">
        <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
        <Input
          placeholder="Search exams by title or subject..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 sm:pl-9 h-9 sm:h-10 text-sm bg-white w-full"
        />
      </div>
      
      {/* Exams Grid - Responsive */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {filteredExams.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-8 sm:p-10 md:p-12 text-center">
              <MonitorPlay className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 text-slate-400 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">No Exams Available</h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                No exams available for {bannerStats?.currentTerm || 'this term'}.
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground/70 mt-1">
                Check back later for new exams
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredExams.map((exam: any, index: number) => (
            <motion.div
              key={exam.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-lg transition-shadow overflow-hidden h-full flex flex-col border-l-4 border-l-emerald-500">
                <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
                  <CardTitle className="text-sm sm:text-base md:text-lg break-words line-clamp-2">
                    {exam.title}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm break-words">
                    {exam.subject}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between px-3 sm:px-4 pb-3 sm:pb-4">
                  <div className="space-y-2 text-[11px] sm:text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        Duration:
                      </span>
                      <span className="font-medium">{exam.duration} mins</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1">
                        <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        Questions:
                      </span>
                      <span className="font-medium">{exam.total_questions}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Award className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        Total Marks:
                      </span>
                      <span className="font-medium">{exam.total_marks}</span>
                    </div>
                    {exam.passing_percentage && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Passing:</span>
                        <span className="font-medium text-emerald-600">{exam.passing_percentage}%</span>
                      </div>
                    )}
                    {exam.has_theory && (
                      <div className="mt-1">
                        <Badge variant="outline" className="text-[9px] sm:text-[10px] bg-purple-50 text-purple-700">
                          Includes Theory Section
                        </Badge>
                      </div>
                    )}
                  </div>
                  <Button 
                    onClick={() => handleTakeExam(exam.id)} 
                    className="w-full mt-3 sm:mt-4 bg-emerald-600 hover:bg-emerald-700 h-8 sm:h-9 text-xs sm:text-sm"
                  >
                    Take Exam <ChevronRight className="ml-1.5 sm:ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
      
      {/* Search Results Count */}
      {searchQuery && filteredExams.length > 0 && (
        <p className="text-[10px] sm:text-xs text-muted-foreground text-center pt-2">
          Found {filteredExams.length} exam{filteredExams.length !== 1 ? 's' : ''}
        </p>
      )}
    </motion.div>
  )
}