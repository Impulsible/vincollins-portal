// src/components/staff/analytics/ClassPerformance.tsx - WITH DARK MODE
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Users, Calendar } from 'lucide-react'

interface ClassStats { 
  name: string; 
  students: number; 
  avgScore: number; 
  passRate: number; 
  highest: number; 
  lowest: number 
}

interface ClassPerformanceProps {
  data: ClassStats[]
  termInfo?: {
    termName: string
    sessionYear: string
    termCode: string
    isCurrent: boolean
  }
}

export function ClassPerformance({ data, termInfo }: ClassPerformanceProps) {
  if (data.length === 0) return (
    <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
      <CardContent className="text-center py-10 text-slate-400 dark:text-slate-500">
        <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
        <p>No class data yet</p>
        {termInfo && termInfo.termName && (
          <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">
            No data for {termInfo.termName} {termInfo.sessionYear}
          </p>
        )}
      </CardContent>
    </Card>
  )

  const totalStudents = data.reduce((sum, cls) => sum + cls.students, 0)
  const avgClassScore = data.length > 0 
    ? Math.round(data.reduce((sum, cls) => sum + cls.avgScore, 0) / data.length)
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
          <p className="text-xs text-slate-500 dark:text-slate-400">Classes</p>
          <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{data.length}</p>
        </div>
        <div className="px-4 py-2.5 text-center border-r border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">Total Students</p>
          <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{totalStudents}</p>
        </div>
        <div className="px-4 py-2.5 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">Avg Class Score</p>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{avgClassScore}%</p>
        </div>
      </div>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-800">
                <TableHead className="text-xs text-slate-600 dark:text-slate-400">Class</TableHead>
                <TableHead className="text-center text-xs text-slate-600 dark:text-slate-400">Students</TableHead>
                <TableHead className="text-center text-xs text-slate-600 dark:text-slate-400">Avg Score</TableHead>
                <TableHead className="text-center text-xs text-slate-600 dark:text-slate-400">Pass Rate</TableHead>
                <TableHead className="text-center text-xs text-slate-600 dark:text-slate-400">Highest</TableHead>
                <TableHead className="text-center text-xs text-slate-600 dark:text-slate-400">Lowest</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(cls => (
                <TableRow 
                  key={cls.name}
                  className="border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <TableCell className="text-sm font-medium text-slate-800 dark:text-slate-100">{cls.name || '—'}</TableCell>
                  <TableCell className="text-center text-sm text-slate-700 dark:text-slate-300">{cls.students || 0}</TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">{cls.avgScore || 0}%</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={
                      cls.passRate >= 50 
                        ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-0' 
                        : 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400 border-0'
                    }>
                      {cls.passRate || 0}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-sm text-emerald-600 dark:text-emerald-400">{cls.highest || 0}</TableCell>
                  <TableCell className="text-center text-sm text-red-500 dark:text-red-400">{cls.lowest || 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}