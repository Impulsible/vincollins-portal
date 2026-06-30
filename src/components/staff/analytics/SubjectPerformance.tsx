// src/components/staff/analytics/SubjectPerformance.tsx
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BookOpen } from 'lucide-react'

interface SubjectStats { name: string; avgScore: number; passRate: number; students: number; highest: number; lowest: number }

export function SubjectPerformance({ data }: { data: SubjectStats[] }) {
  if (data.length === 0) return (
    <Card className="border-0 shadow-sm">
      <CardContent className="text-center py-10 text-slate-400">
        <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
        <p>No subject data yet</p>
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