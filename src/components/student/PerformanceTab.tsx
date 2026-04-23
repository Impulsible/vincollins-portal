import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft } from 'lucide-react'

interface PerformanceTabProps {
  stats: any
  displayTotalSubjects: number
  handleTabChange: (tab: string) => void
}

export function PerformanceTab({ stats, displayTotalSubjects, handleTabChange }: PerformanceTabProps) {
  return (
    <motion.div 
      key="performance" 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0 }} 
      className="w-full overflow-hidden"
    >
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl sm:text-2xl font-bold">Performance Analytics</h1>
        <Button variant="outline" size="sm" onClick={() => handleTabChange('overview')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Overview
        </Button>
      </div>
      
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Exam Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Overall Pass Rate</span>
                  <span>{stats.completedExams > 0 ? Math.round((stats.passedExams / stats.completedExams) * 100) : 0}%</span>
                </div>
                <Progress value={stats.completedExams > 0 ? (stats.passedExams / stats.completedExams) * 100 : 0} className="h-2" />
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{stats.passedExams}</p>
                  <p className="text-sm text-green-600">Exams Passed</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{stats.failedExams}</p>
                  <p className="text-sm text-red-600">Exams Failed</p>
                </div>
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-between">
                  <span className="text-slate-600">Average Score</span>
                  <span className="font-bold">{stats.averageScore}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Subject Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Total Subjects</span>
                <span className="font-bold">{displayTotalSubjects}</span>
              </div>
              <div className="flex justify-between">
                <span>Exams Completed</span>
                <span className="font-bold">{stats.completedExams}</span>
              </div>
              <div className="flex justify-between">
                <span>Pending Results</span>
                <span className="font-bold">{stats.pendingResults}</span>
              </div>
              <div className="flex justify-between">
                <span>Available Exams</span>
                <span className="font-bold">{stats.availableExams.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}