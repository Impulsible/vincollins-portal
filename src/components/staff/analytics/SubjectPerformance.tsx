// src/components/staff/analytics/SubjectPerformance.tsx - WITH TERM & SESSION DISPLAY
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
    <Card className="border-0 shadow-sm">
      <CardContent className="text-center py-10 text-slate-400">
        <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
        <p>No subject data yet</p>
        {termInfo && termInfo.termName && (
          <p className="text-xs text-slate-300 mt-1">
            No data for {termInfo.termName} {termInfo.sessionYear}
          </p>
        )}
      </CardContent>
    </Card>
  )

  // Calculate summary stats
  const totalStudents = data.reduce((sum, subj) => sum + subj.students, 0)
  const avgSubjectScore = data.length > 0 
    ? Math.round(data.reduce((sum, subj) => sum + subj.avgScore, 0) / data.length)
    : 0
  const avgPassRate = data.length > 0
    ? Math.round(data.reduce((sum, subj) => sum + subj.passRate, 0) / data.length)
    : 0

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      {/* ✅ Term Info Header */}
      {termInfo && termInfo.termName && (
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2 text-xs text-slate-500">
          <Calendar className="h-3.5 w-3.5 text-emerald-600" />
          <span className="font-medium text-slate-700">{termInfo.termName}</span>
          <span className="text-slate-300">·</span>
          <span className="font-medium text-slate-700">{termInfo.sessionYear}</span>
          {termInfo.isCurrent && (
            <Badge className="ml-1 bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]">
              Current
            </Badge>
          )}
        </div>
      )}

      {/* ✅ Summary Stats Bar */}
      <div className="grid grid-cols-3 gap-0 border-b border-slate-100 bg-white">
        <div className="px-4 py-2.5 text-center border-r border-slate-100">
          <p className="text-xs text-slate-500">Subjects</p>
          <p className="text-lg font-bold text-slate-800">{data.length}</p>
        </div>
        <div className="px-4 py-2.5 text-center border-r border-slate-100">
          <p className="text-xs text-slate-500">Total Students</p>
          <p className="text-lg font-bold text-slate-800">{totalStudents}</p>
        </div>
        <div className="px-4 py-2.5 text-center">
          <p className="text-xs text-slate-500">Avg Subject Score</p>
          <p className="text-lg font-bold text-emerald-600">{avgSubjectScore}%</p>
        </div>
      </div>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="text-xs">Subject</TableHead>
                <TableHead className="text-center text-xs">Students</TableHead>
                <TableHead className="text-center text-xs">Avg Score</TableHead>
                <TableHead className="text-center text-xs">Pass Rate</TableHead>
                <TableHead className="text-center text-xs">Highest</TableHead>
                <TableHead className="text-center text-xs">Lowest</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(subj => (
                <TableRow key={subj.name}>
                  <TableCell className="text-sm font-medium">{subj.name || '—'}</TableCell>
                  <TableCell className="text-center text-sm">{subj.students || 0}</TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-sm">{subj.avgScore || 0}%</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={(subj.passRate || 0) >= 50 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                      {subj.passRate || 0}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-sm text-emerald-600">{subj.highest || 0}</TableCell>
                  <TableCell className="text-center text-sm text-red-500">{subj.lowest || 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}