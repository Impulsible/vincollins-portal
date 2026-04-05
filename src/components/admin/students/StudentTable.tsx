'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Edit, Eye, KeyRound, MoreVertical } from 'lucide-react'

// Define the Student interface
interface Student {
  id: string
  vin_id: string
  email: string
  full_name: string
  class?: string | null
  department?: string | null
  is_active: boolean
  photo_url?: string | null
  created_at?: string
  password_changed?: boolean
}

interface StudentTableProps {
  students: Student[]
  onEdit: (student: Student) => void
  onViewResults: (student: Student) => void
  onResetPassword: (student: Student) => void
}

export function StudentTable({ students, onEdit, onViewResults, onResetPassword }: StudentTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>VIN ID</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Class</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[70px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                No students found
              </TableCell>
            </TableRow>
          ) : (
            students.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium">{student.full_name}</TableCell>
                <TableCell className="font-mono text-xs">{student.vin_id}</TableCell>
                <TableCell>{student.email}</TableCell>
                <TableCell>{student.class || '-'}</TableCell>
                <TableCell>{student.department || '-'}</TableCell>
                <TableCell>
                  {student.is_active ? (
                    <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-red-100 text-red-800 hover:bg-red-100">
                      Inactive
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(student)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onViewResults(student)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Results
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onResetPassword(student)}>
                        <KeyRound className="mr-2 h-4 w-4" />
                        Reset Password
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}