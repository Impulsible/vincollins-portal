// src/components/staff/analytics/TopStudents.tsx
// @ts-nocheck
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Trophy, Medal, Star, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

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

export function TopStudents({ data }: { data: any[] }) {
  if (data.length === 0) return (
    <Card className="border-0 shadow-sm">
      <CardContent className="text-center py-10 text-slate-400">
        <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
        <p>No student data yet</p>
      </CardContent>
    </Card>
  )

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
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