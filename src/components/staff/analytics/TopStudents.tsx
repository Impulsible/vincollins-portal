// src/components/staff/analytics/TopStudents.tsx - WITH DARK MODE
// @ts-nocheck
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Trophy, Medal, Users, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TopStudentsProps {
  data: any[]
  termInfo?: {
    termName: string
    sessionYear: string
    termCode: string
    isCurrent: boolean
  }
}

const getRankIcon = (index: number) => {
  if (index === 0) return <Trophy className="h-4 w-4 text-amber-500 dark:text-amber-400" />
  if (index === 1) return <Medal className="h-4 w-4 text-slate-400 dark:text-slate-500" />
  if (index === 2) return <Medal className="h-4 w-4 text-amber-700 dark:text-amber-600" />
  return <span className="text-xs text-slate-400 dark:text-slate-500 w-4 text-center font-medium">{index + 1}</span>
}

const getScoreColor = (pct: number): string => {
  if (pct >= 75) return 'text-emerald-600 dark:text-emerald-400'
  if (pct >= 60) return 'text-blue-600 dark:text-blue-400'
  if (pct >= 50) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

const getProgressColor = (pct: number): string => {
  if (pct >= 75) return 'bg-emerald-500'
  if (pct >= 60) return 'bg-blue-500'
  if (pct >= 50) return 'bg-amber-500'
  return 'bg-red-400'
}

const getInitials = (name: string) => {
  if (!name) return 'ST'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function TopStudents({ data, termInfo }: TopStudentsProps) {
  if (data.length === 0) return (
    <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
      <CardContent className="text-center py-10 text-slate-400 dark:text-slate-500">
        <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
        <p>No student data yet</p>
        {termInfo && termInfo.termName && (
          <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">
            No data for {termInfo.termName} {termInfo.sessionYear}
          </p>
        )}
      </CardContent>
    </Card>
  )

  const topStudent = data[0]

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

      {topStudent && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-b border-amber-100 dark:border-amber-900/50 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute -inset-1 bg-amber-500 rounded-full blur opacity-20" />
              <div className="relative h-12 w-12 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">🏆 Top Performer</p>
              <p className="font-semibold text-slate-800 dark:text-slate-100">{topStudent.name}</p>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>{topStudent.class}</span>
                <span>·</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{topStudent.avgScore}%</span>
                <span>avg</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-800">
                <TableHead className="text-xs w-10 text-slate-600 dark:text-slate-400">#</TableHead>
                <TableHead className="text-xs text-slate-600 dark:text-slate-400">Student</TableHead>
                <TableHead className="text-center text-xs text-slate-600 dark:text-slate-400">Class</TableHead>
                <TableHead className="text-center text-xs text-slate-600 dark:text-slate-400">Avg Score</TableHead>
                <TableHead className="text-center text-xs text-slate-600 dark:text-slate-400">Subjects</TableHead>
                <TableHead className="text-xs text-slate-600 dark:text-slate-400">Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((student, index) => (
                <TableRow 
                  key={student.id || index} 
                  className={cn(
                    'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50',
                    index < 3 && 'bg-amber-50/30 dark:bg-amber-950/10'
                  )}
                >
                  <TableCell className="text-center">{getRankIcon(index)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {getInitials(student.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium truncate max-w-[150px] text-slate-800 dark:text-slate-100">
                        {student.name || 'Unknown'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="text-xs border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                      {student.class || '—'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={cn("font-bold text-sm", getScoreColor(student.avgScore || 0))}>
                      {student.avgScore || 0}%
                    </span>
                  </TableCell>
                  <TableCell className="text-center text-sm text-slate-500 dark:text-slate-400">
                    {student.subjects || 0}
                  </TableCell>
                  <TableCell>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 max-w-[100px]">
                      <div 
                        className={cn("h-1.5 rounded-full transition-all", getProgressColor(student.avgScore || 0))} 
                        style={{ width: `${Math.min(student.avgScore || 0, 100)}%` }} 
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}