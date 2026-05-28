'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Edit, Eye, KeyRound, MoreVertical, Mail, BookOpen, User, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  // Get initials from full name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow className="border-b border-slate-200">
              <TableHead className="font-semibold text-slate-700 py-4 px-4">Student</TableHead>
              <TableHead className="font-semibold text-slate-700 py-4 px-4">VIN ID</TableHead>
              <TableHead className="font-semibold text-slate-700 py-4 px-4 hidden md:table-cell">Email</TableHead>
              <TableHead className="font-semibold text-slate-700 py-4 px-4">Class</TableHead>
              <TableHead className="font-semibold text-slate-700 py-4 px-4 hidden lg:table-cell">Department</TableHead>
              <TableHead className="font-semibold text-slate-700 py-4 px-4">Status</TableHead>
              <TableHead className="font-semibold text-slate-700 py-4 px-4 text-center w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <User className="h-12 w-12 text-slate-300" />
                    <p className="text-slate-500 font-medium">No students found</p>
                    <p className="text-sm text-slate-400">Try adjusting your search or filters</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              students.map((student, index) => (
                <TableRow 
                  key={student.id} 
                  className={cn(
                    "border-b border-slate-100 hover:bg-slate-50/50 transition-colors",
                    index % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                  )}
                >
                  <TableCell className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 ring-1 ring-slate-200">
                        <AvatarImage src={student.photo_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs font-medium">
                          {getInitials(student.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-slate-800">{student.full_name}</p>
                        <p className="text-xs text-slate-500 md:hidden">{student.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-4">
                    <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono text-slate-700">
                      {student.vin_id}
                    </code>
                  </TableCell>
                  <TableCell className="py-3 px-4 hidden md:table-cell">
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-sm text-slate-600">{student.email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-4">
                    <Badge variant="outline" className="bg-slate-50 text-slate-700 font-normal">
                      {student.class || '-'}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 px-4 hidden lg:table-cell">
                    <span className="text-sm text-slate-600">
                      {student.department || '-'}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 px-4">
                    <Badge className={cn(
                      "text-xs font-medium px-2 py-0.5",
                      student.is_active 
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" 
                        : "bg-slate-100 text-slate-600 hover:bg-slate-100"
                    )}>
                      <Shield className="h-3 w-3 mr-1 inline" />
                      {student.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 px-4 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 hover:bg-slate-100 transition-colors"
                        >
                          <MoreVertical className="h-4 w-4 text-slate-500" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuLabel className="text-xs font-medium text-slate-500">
                          Actions
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onEdit(student)}
                          className="cursor-pointer"
                        >
                          <Edit className="mr-2 h-4 w-4 text-emerald-600" />
                          Edit Student
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onViewResults(student)}
                          className="cursor-pointer"
                        >
                          <Eye className="mr-2 h-4 w-4 text-blue-600" />
                          View Results
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onResetPassword(student)}
                          className="cursor-pointer"
                        >
                          <KeyRound className="mr-2 h-4 w-4 text-amber-600" />
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
    </div>
  )
}