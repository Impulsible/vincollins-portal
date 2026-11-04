// components/admin/students/components/StudentTableRow.tsx - WITH DARK MODE
'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MoreVertical, Eye, Edit, KeyRound, Trash2, BookOpen, Shield, ShieldAlert, ShieldCheck,
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
  onToggleStatus: (student: Student) => void
}

export const StudentTableRow = memo(function StudentTableRow({
  student, index, status, lastSeen, onViewDetails, onEdit, onResetPassword, onDelete, onToggleStatus,
}: StudentTableRowProps) {
  const genderEmoji = GENDERS.find(g => g.value === student.gender)?.emoji || ''

  return (
    <motion.tr
      key={student.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.02 }}
      className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
    >
      {/* Student Info */}
      <TableCell className="py-4 px-4">
        <div className="flex items-center gap-3 min-w-[200px]">
          <Avatar className="h-10 w-10 ring-1 ring-slate-200 dark:ring-slate-700 shadow-sm">
            <AvatarImage src={student.photo_url || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-medium text-sm">
              {getInitials(student.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-slate-800 dark:text-white truncate">{student.display_name || student.full_name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{student.email}</p>
          </div>
        </div>
      </TableCell>

      {/* VIN ID */}
      <TableCell className="py-4 px-4">
        <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
          {student.vin_id}
        </code>
      </TableCell>

      {/* Admission Number */}
      <TableCell className="py-4 px-4">
        <code className="text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded font-mono font-medium whitespace-nowrap">
          {student.admission_number || '-'}
        </code>
      </TableCell>

      {/* Class */}
      <TableCell className="py-4 px-4">
        <Badge variant="outline" className="font-normal bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 whitespace-nowrap">
          {student.class || 'Not Assigned'}
        </Badge>
      </TableCell>

      {/* Department */}
      <TableCell className="py-4 px-4 hidden lg:table-cell">
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <BookOpen className="h-4 w-4 text-slate-400 dark:text-slate-500" />
          <span className="text-sm text-slate-600 dark:text-slate-300">{student.department || 'General'}</span>
        </div>
      </TableCell>

      {/* Status */}
      <TableCell className="py-4 px-4">
        <Badge className={cn(
          "text-xs font-medium px-2 py-1 whitespace-nowrap",
          student.is_active 
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/60" 
            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
        )}>
          <Shield className="h-3 w-3 mr-1 inline" />
          {student.is_active ? 'Active' : 'Inactive'}
        </Badge>
      </TableCell>

      {/* Actions */}
      <TableCell className="py-4 px-4 text-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800">
              <MoreVertical className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <DropdownMenuLabel className="text-xs text-slate-500 dark:text-slate-400">Actions</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-700" />
            <DropdownMenuItem onClick={() => onViewDetails(student)} className="cursor-pointer text-slate-700 dark:text-slate-300 focus:bg-slate-100 dark:focus:bg-slate-700">
              <Eye className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" /> View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(student)} className="cursor-pointer text-slate-700 dark:text-slate-300 focus:bg-slate-100 dark:focus:bg-slate-700">
              <Edit className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Edit Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleStatus(student)} className="cursor-pointer font-medium text-slate-700 dark:text-slate-300 focus:bg-slate-100 dark:focus:bg-slate-700">
              {student.is_active ? (
                <><ShieldAlert className="mr-2 h-4 w-4 text-amber-600 dark:text-amber-400" /> Set Inactive (Left)</>
              ) : (
                <><ShieldCheck className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Reactivate Student</>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onResetPassword(student)} className="cursor-pointer text-slate-700 dark:text-slate-300 focus:bg-slate-100 dark:focus:bg-slate-700">
              <KeyRound className="mr-2 h-4 w-4 text-amber-600 dark:text-amber-400" /> Reset Password
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-700" />
            <DropdownMenuItem onClick={() => onDelete(student)} className="text-red-600 dark:text-red-400 cursor-pointer focus:bg-red-50 dark:focus:bg-red-950/30">
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </motion.tr>
  )
})

export default StudentTableRow