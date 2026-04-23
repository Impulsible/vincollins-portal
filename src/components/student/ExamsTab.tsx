import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, ArrowLeft, MonitorPlay, ChevronRight } from 'lucide-react'

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
      className="w-full overflow-hidden"
    >
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl sm:text-2xl font-bold">Available Exams</h1>
        <Button variant="outline" size="sm" onClick={() => handleTabChange('overview')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Overview
        </Button>
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <Badge className="bg-emerald-100 text-emerald-700 w-fit">
          {stats.availableExams.length} available
        </Badge>
      </div>
      
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search exams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white w-full"
          />
        </div>
      </div>
      
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {filteredExams.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center">
              <MonitorPlay className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500">No exams available for {bannerStats.currentTerm}.</p>
            </CardContent>
          </Card>
        ) : (
          filteredExams.map((exam: any) => (
            <Card key={exam.id} className="hover:shadow-lg transition-shadow overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-base sm:text-lg break-words">{exam.title}</CardTitle>
                <CardDescription className="text-sm break-words">{exam.subject}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Duration:</span>
                    <span>{exam.duration} mins</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Questions:</span>
                    <span>{exam.total_questions}</span>
                  </div>
                  <Button onClick={() => handleTakeExam(exam.id)} className="w-full mt-3 bg-emerald-600 text-sm">
                    Take Exam <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </motion.div>
  )
}