// src/components/staff/analytics/SubjectPerformance.tsx - WITH DARK MODE
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BookOpen, Calendar } from 'lucide-react'

interface SubjectStats { 
  name: string; 
  avgScore: number; 
  passRate: number; 
  students: number; 
  highest: number; 
  lowest: number 
}

interface SubjectPerformanceProps {
  data: SubjectStats[]
  termInfo?: {
    termName: string
    sessionYear: string
    termCode: string
    isCurrent: boolean
  }
}

export function SubjectPerformance({ data, termInfo }: SubjectPerformanceProps) {
  if (data.length === 0) return (
    <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
      <CardContent className="text-center py-10 text-slate-400 dark:text-slate-500">
        <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
        <p>No subject data yet</p>
        {termInfo && termInfo.termName && (
          <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">
            No data for {termInfo.termName} {termInfo.sessionYear}
          </p>
        )}
      </CardContent>
    </Card>
  )

  const totalStudents = data.reduce((sum, subj) => sum + subj.students, 0)
  const avgSubjectScore = data.length > 0 
    ? Math.round(data.reduce((sum, subj) => sum + subj.avgScore, 0) / data.length)
    : 0

  return (
    <Card className="border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900 transition-colors duration-300">
      {termInfo && termInfo.termName && (
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Calendar className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="font-medium text-slate-700 dark:text-slate-200">{termInfo.termName}</span>
          <span className="text-slate-300 dark:text-slate-600">·</span>
          <span className="font-medium text-slate-700 dark:text-slate-200">{termInfo.sessionYear}</span>
          {termInfo.isCurrent && (
            <Badge className="ml-1 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-[10px]">
              Current
            </Badge>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-0 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="px-4 py-2.5 text-center border-r border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">Subjects</p>
          <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{data.length}</p>
        </div>
        <div className="px-4 py-2.5 text-center border-r border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">Total Students</p>
          <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{totalStudents}</p>
        </div>
        <div className="px-4 py-2.5 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">Avg Subject Score</p>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{avgSubjectScore}%</p>
        </div>
      </div>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-800">
                <TableHead className="text-xs text-slate-600 dark:text-slate-400">Subject</TableHead>
                <TableHead className="text-center text-xs text-slate-600 dark:text-slate-400">Students</TableHead>
                <TableHead className="text-center text-xs text-slate-600 dark:text-slate-400">Avg Score</TableHead>
                <TableHead className="text-center text-xs text-slate-600 dark:text-slate-400">Pass Rate</TableHead>
                <TableHead className="text-center text-xs text-slate-600 dark:text-slate-400">Highest</TableHead>
                <TableHead className="text-center text-xs text-slate-600 dark:text-slate-400">Lowest</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(subj => (
                <TableRow 
                  key={subj.name}
                  className="border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <TableCell className="text-sm font-medium text-slate-800 dark:text-slate-100">{subj.name || '—'}</TableCell>
                  <TableCell className="text-center text-sm text-slate-700 dark:text-slate-300">{subj.students || 0}</TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">{subj.avgScore || 0}%</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={
                      (subj.passRate || 0) >= 50 
                        ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-0' 
                        : 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400 border-0'
                    }>
                      {subj.passRate || 0}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-sm text-emerald-600 dark:text-emerald-400">{subj.highest || 0}</TableCell>
                  <TableCell className="text-center text-sm text-red-500 dark:text-red-400">{subj.lowest || 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}