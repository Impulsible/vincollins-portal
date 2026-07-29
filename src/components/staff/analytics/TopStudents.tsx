// src/components/staff/analytics/TopStudents.tsx - WITH TERM & SESSION DISPLAY
// @ts-nocheck
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Trophy, Medal, Star, Users, Calendar } from 'lucide-react'
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
  if (index === 0) return <Trophy className="h-4 w-4 text-amber-500" />
  if (index === 1) return <Medal className="h-4 w-4 text-slate-400" />
  if (index === 2) return <Medal className="h-4 w-4 text-amber-700" />
  return <span className="text-xs text-slate-400 w-4 text-center font-medium">{index + 1}</span>
}

const getScoreColor = (pct: number): string => {
  if (pct >= 75) return 'text-emerald-600'
  if (pct >= 60) return 'text-blue-600'
  if (pct >= 50) return 'text-amber-600'
  return 'text-red-600'
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
    <Card className="border-0 shadow-sm">
      <CardContent className="text-center py-10 text-slate-400">
        <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
        <p>No student data yet</p>
        {termInfo && termInfo.termName && (
          <p className="text-xs text-slate-300 mt-1">
            No data for {termInfo.termName} {termInfo.sessionYear}
          </p>
        )}
      </CardContent>
    </Card>
  )

  // Calculate top student stats
  const avgTopScore = data.length > 0 
    ? Math.round(data.reduce((sum, s) => sum + s.avgScore, 0) / data.length)
    : 0
  const topStudent = data[0]

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

      {/* ✅ Top Student Spotlight */}
      {topStudent && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-100 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute -inset-1 bg-amber-500 rounded-full blur opacity-20" />
              <div className="relative h-12 w-12 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <p className="text-xs text-amber-600 font-medium">🏆 Top Performer</p>
              <p className="font-semibold text-slate-800">{topStudent.name}</p>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>{topStudent.class}</span>
                <span>·</span>
                <span className="font-bold text-emerald-600">{topStudent.avgScore}%</span>
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
              <TableRow className="bg-slate-50">
                <TableHead className="text-xs w-10">#</TableHead>
                <TableHead className="text-xs">Student</TableHead>
                <TableHead className="text-center text-xs">Class</TableHead>
                <TableHead className="text-center text-xs">Avg Score</TableHead>
                <TableHead className="text-center text-xs">Subjects</TableHead>
                <TableHead className="text-xs">Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((student, index) => (
                <TableRow key={student.id || index} className={cn(index < 3 && 'bg-amber-50/30')}>
                  <TableCell className="text-center">{getRankIcon(index)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-[10px] bg-slate-200 text-slate-600">
                          {getInitials(student.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium truncate max-w-[150px]">
                        {student.name || 'Unknown'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="text-xs">{student.class || '—'}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={cn("font-bold text-sm", getScoreColor(student.avgScore || 0))}>
                      {student.avgScore || 0}%
                    </span>
                  </TableCell>
                  <TableCell className="text-center text-sm text-slate-500">
                    {student.subjects || 0}
                  </TableCell>
                  <TableCell>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 max-w-[100px]">
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