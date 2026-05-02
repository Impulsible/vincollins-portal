// src/components/staff/analytics/TopStudents.tsx
// @ts-nocheck
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Trophy, Medal, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

const getRankIcon = (index: number) => {
  if (index === 0) return <Trophy className="h-4 w-4 text-amber-500" />
  if (index === 1) return <Medal className="h-4 w-4 text-slate-400" />
  if (index === 2) return <Medal className="h-4 w-4 text-amber-700" />
  return <span className="text-xs text-slate-400 w-4 text-center">{index + 1}</span>
}

const getScoreColor = (pct: number): string => {
  if (pct >= 75) return 'text-emerald-600'
  if (pct >= 60) return 'text-blue-600'
  if (pct >= 50) return 'text-amber-600'
  return 'text-red-600'
}

const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

export function TopStudents({ data }: { data: any[] }) {
  if (data.length === 0) return <Card className="border-0 shadow-sm"><CardContent className="text-center py-10 text-slate-400">No student data yet</CardContent></Card>

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
                <TableRow key={student.id} className={cn(index < 3 && 'bg-amber-50/30')}>
                  <TableCell className="text-center">{getRankIcon(index)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7"><AvatarFallback className="text-[10px] bg-slate-200">{getInitials(student.name)}</AvatarFallback></Avatar>
                      <span className="text-sm font-medium truncate max-w-[150px]">{student.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center"><Badge variant="outline" className="text-xs">{student.class}</Badge></TableCell>
                  <TableCell className="text-center"><span className={cn("font-bold text-sm", getScoreColor(student.avgScore))}>{student.avgScore}%</span></TableCell>
                  <TableCell className="text-center text-sm text-slate-500">{student.subjects}</TableCell>
                  <TableCell>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 max-w-[100px]">
                      <div className={cn("h-1.5 rounded-full", student.avgScore >= 75 ? 'bg-emerald-500' : student.avgScore >= 50 ? 'bg-blue-500' : 'bg-red-400')} style={{ width: `${Math.min(student.avgScore, 100)}%` }} />
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