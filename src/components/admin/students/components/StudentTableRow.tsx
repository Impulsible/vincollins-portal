// components/admin/students/components/StudentTableRow.tsx

'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { TableCell, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MoreVertical,
  Eye,
  Edit,
  KeyRound,
  Trash2,
  BookOpen,
  Shield,
} from 'lucide-react'
import { Student, PresenceStatus } from '../types'
import { GENDERS } from '../constants'
import { getInitials } from '../utils'
import { cn } from '@/lib/utils'

interface StudentTableRowProps {
  student: Student
  index: number
  status: PresenceStatus
  lastSeen: string
  onViewDetails: (student: Student) => void
  onEdit: (student: Student) => void
  onResetPassword: (student: Student) => void
  onDelete: (student: Student) => void
}

// ✅ Use memo to prevent unnecessary re-renders
export const StudentTableRow = memo(function StudentTableRow({
  student,
  index,
  status,
  lastSeen,
  onViewDetails,
  onEdit,
  onResetPassword,
  onDelete,
}: StudentTableRowProps) {
  const genderEmoji = GENDERS.find(g => g.value === student.gender)?.emoji || ''

  return (
    <motion.tr
      key={student.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.02 }}
      className="border-b hover:bg-slate-50/50 transition-colors"
    >
      {/* Student Info */}
      <TableCell className="py-4 px-4">
        <div className="flex items-center gap-3 min-w-[200px]">
          <Avatar className="h-10 w-10 ring-1 ring-slate-200 shadow-sm">
            <AvatarImage src={student.photo_url || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-medium text-sm">
              {getInitials(student.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-slate-800 truncate">{student.display_name || student.full_name}</p>
            <p className="text-xs text-slate-500 truncate">{student.email}</p>
          </div>
        </div>
      </TableCell>

      {/* VIN ID */}
      <TableCell className="py-4 px-4">
        <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono text-slate-700 whitespace-nowrap">
          {student.vin_id}
        </code>
      </TableCell>

      {/* Admission Number */}
      <TableCell className="py-4 px-4">
        <code className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded font-mono font-medium whitespace-nowrap">
          {student.admission_number || '-'}
        </code>
      </TableCell>

      {/* Class */}
      <TableCell className="py-4 px-4">
        <Badge variant="outline" className="font-normal bg-slate-50 text-slate-700 whitespace-nowrap">
          {student.class || 'Not Assigned'}
        </Badge>
      </TableCell>

      {/* Department */}
      <TableCell className="py-4 px-4 hidden lg:table-cell">
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <BookOpen className="h-4 w-4 text-slate-400" />
          <span className="text-sm text-slate-600">{student.department || 'General'}</span>
        </div>
      </TableCell>

      {/* Status - Only Active/Inactive */}
      <TableCell className="py-4 px-4">
        <Badge className={cn(
          "text-xs font-medium px-2 py-1 whitespace-nowrap",
          student.is_active 
            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" 
            : "bg-slate-100 text-slate-600 hover:bg-slate-100"
        )}>
          <Shield className="h-3 w-3 mr-1 inline" />
          {student.is_active ? 'Active' : 'Inactive'}
        </Badge>
      </TableCell>

      {/* Actions */}
      <TableCell className="py-4 px-4 text-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100">
              <MoreVertical className="h-4 w-4 text-slate-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs text-slate-500">Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onViewDetails(student)} className="cursor-pointer">
              <Eye className="mr-2 h-4 w-4 text-blue-600" /> View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(student)} className="cursor-pointer">
              <Edit className="mr-2 h-4 w-4 text-emerald-600" /> Edit Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onResetPassword(student)} className="cursor-pointer">
              <KeyRound className="mr-2 h-4 w-4 text-amber-600" /> Reset Password
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(student)}
              className="text-red-600 cursor-pointer"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </motion.tr>
  )
})

// ✅ Default export for compatibility
export default StudentTableRow