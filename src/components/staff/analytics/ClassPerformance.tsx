// src/components/staff/analytics/ClassPerformance.tsx
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Users } from 'lucide-react'

interface ClassStats { name: string; students: number; avgScore: number; passRate: number; highest: number; lowest: number }

export function ClassPerformance({ data }: { data: ClassStats[] }) {
  if (data.length === 0) return <Card className="border-0 shadow-sm"><CardContent className="text-center py-10 text-slate-400">No class data yet</CardContent></Card>

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow className="bg-slate-50"><TableHead className="text-xs">Class</TableHead><TableHead className="text-center text-xs">Students</TableHead><TableHead className="text-center text-xs">Avg Score</TableHead><TableHead className="text-center text-xs">Pass Rate</TableHead><TableHead className="text-center text-xs">Highest</TableHead><TableHead className="text-center text-xs">Lowest</TableHead></TableRow></TableHeader>
            <TableBody>
              {data.map(cls => (
                <TableRow key={cls.name}>
                  <TableCell className="text-sm font-medium">{cls.name}</TableCell>
                  <TableCell className="text-center text-sm">{cls.students}</TableCell>
                  <TableCell className="text-center"><span className="font-semibold text-sm">{cls.avgScore}%</span></TableCell>
                  <TableCell className="text-center"><Badge className={cls.passRate >= 50 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>{cls.passRate}%</Badge></TableCell>
                  <TableCell className="text-center text-sm text-emerald-600">{cls.highest}</TableCell>
                  <TableCell className="text-center text-sm text-red-500">{cls.lowest}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}