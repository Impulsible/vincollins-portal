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
    <Card className="border-0 shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-semibold py-4 px-4">Student</TableHead>
              <TableHead className="font-semibold py-4 px-4">VIN ID</TableHead>
              <TableHead className="font-semibold py-4 px-4">Admission No.</TableHead>
              <TableHead className="font-semibold py-4 px-4">Class</TableHead>
              <TableHead className="font-semibold py-4 px-4 hidden lg:table-cell">Gender</TableHead>
              <TableHead className="font-semibold py-4 px-4 hidden lg:table-cell">Year</TableHead>
              <TableHead className="font-semibold py-4 px-4 hidden md:table-cell">Dept</TableHead>
              <TableHead className="font-semibold py-4 px-4">Status</TableHead>
              <TableHead className="font-semibold py-4 px-4 hidden sm:table-cell">Last Seen</TableHead>
              <TableHead className="font-semibold py-4 px-4 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center">
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