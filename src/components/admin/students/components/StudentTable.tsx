// components/admin/students/components/StudentTable.tsx

'use client'

import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Student, PresenceStatus } from '../types'
import { StudentTableRow } from './StudentTableRow'
import { EmptyState } from './EmptyState'

interface StudentTableProps {
  students: Student[]
  searchQuery: string
  getStatus: (id: string) => PresenceStatus
  getLastSeen: (id: string) => string
  onViewDetails: (student: Student) => void
  onEdit: (student: Student) => void
  onResetPassword: (student: Student) => void
  onDelete: (student: Student) => void
}

export function StudentTable({
  students,
  searchQuery,
  getStatus,
  getLastSeen,
  onViewDetails,
  onEdit,
  onResetPassword,
  onDelete,
}: StudentTableProps) {
  return (
    <Card className="border shadow-sm rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow className="border-b border-slate-200">
              <TableHead className="font-semibold text-slate-700 py-4 px-4">Student</TableHead>
              <TableHead className="font-semibold text-slate-700 py-4 px-4">VIN ID</TableHead>
              <TableHead className="font-semibold text-slate-700 py-4 px-4">Admission No.</TableHead>
              <TableHead className="font-semibold text-slate-700 py-4 px-4">Class</TableHead>
              <TableHead className="font-semibold text-slate-700 py-4 px-4 hidden lg:table-cell">Dept</TableHead>
              <TableHead className="font-semibold text-slate-700 py-4 px-4">Status</TableHead>
              <TableHead className="font-semibold text-slate-700 py-4 px-4 text-center w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <EmptyState searchQuery={searchQuery} />
                </TableCell>
              </TableRow>
            ) : (
              students.map((student, index) => (
                <StudentTableRow
                  key={student.id}
                  student={student}
                  index={index}
                  status={getStatus(student.id)}
                  lastSeen={getLastSeen(student.id)}
                  onViewDetails={onViewDetails}
                  onEdit={onEdit}
                  onResetPassword={onResetPassword}
                  onDelete={onDelete}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}

// Add default export
export default StudentTable