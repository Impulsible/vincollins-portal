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
  Calendar,
  BookOpen,
  Clock,
} from 'lucide-react'
import { Student, PresenceStatus } from '../types'
import { GENDERS } from '../constants'
import { getInitials, formatLastSeen } from '../utils'
import { StatusBadge } from './StudentPresenceIndicator'

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
      key={student.id} // ✅ Key ensures React tracks this row properly
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.02 }}
      className="border-b hover:bg-muted/30 transition-colors"
    >
      {/* Student Info with Presence */}
      <TableCell className="py-4 px-4">
        <div className="flex items-center gap-3 min-w-[200px]">
          <div className="relative flex-shrink-0">
            <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
              <AvatarImage src={student.photo_url} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-medium">
                {getInitials(student.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5">
              <PresenceDot status={status} />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium truncate">{student.display_name || student.full_name}</p>
            <p className="text-xs text-muted-foreground truncate">{student.email}</p>
          </div>
        </div>
      </TableCell>

      {/* VIN ID */}
      <TableCell className="py-4 px-4">
        <code className="text-xs bg-muted px-2 py-1 rounded font-mono whitespace-nowrap">
          {student.vin_id}
        </code>
      </TableCell>

      {/* Admission Number */}
      <TableCell className="py-4 px-4">
        <code className="text-xs bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 px-2 py-1 rounded font-mono font-bold whitespace-nowrap">
          {student.admission_number || '-'}
        </code>
      </TableCell>

      {/* Class */}
      <TableCell className="py-4 px-4">
        <Badge variant="outline" className="font-normal whitespace-nowrap">
          {student.class || 'Not Assigned'}
        </Badge>
      </TableCell>

      {/* Gender */}
      <TableCell className="py-4 px-4 hidden lg:table-cell">
        <span className="capitalize text-sm">
          {genderEmoji} {student.gender || '-'}
        </span>
      </TableCell>

      {/* Admission Year */}
      <TableCell className="py-4 px-4 hidden lg:table-cell">
        <div className="flex items-center gap-1 whitespace-nowrap">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{student.admission_year || '-'}</span>
        </div>
      </TableCell>

      {/* Department */}
      <TableCell className="py-4 px-4 hidden md:table-cell">
        <div className="flex items-center gap-1 whitespace-nowrap">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{student.department || 'General'}</span>
        </div>
      </TableCell>

      {/* Status */}
      <TableCell className="py-4 px-4">
        <StatusBadge status={status} isActive={student.is_active} />
      </TableCell>

      {/* Last Seen */}
      <TableCell className="py-4 px-4 hidden sm:table-cell">
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs">{formatLastSeen(lastSeen)}</span>
        </div>
      </TableCell>

      {/* Actions */}
      <TableCell className="py-4 px-4 text-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onViewDetails(student)}>
              <Eye className="mr-2 h-4 w-4" /> View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(student)}>
              <Edit className="mr-2 h-4 w-4" /> Edit Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onResetPassword(student)}>
              <KeyRound className="mr-2 h-4 w-4" /> Reset Password
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(student)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </motion.tr>
  )
})

// Presence Dot sub-component
function PresenceDot({ status }: { status: PresenceStatus }) {
  if (status === 'online') {
    return (
      <span className="flex h-3.5 w-3.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white" />
      </span>
    )
  }
  if (status === 'away') {
    return (
      <span className="flex h-3 w-3">
        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400 border-2 border-white" />
      </span>
    )
  }
  return (
    <span className="flex h-3 w-3">
      <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-300 border-2 border-white" />
    </span>
  )
}