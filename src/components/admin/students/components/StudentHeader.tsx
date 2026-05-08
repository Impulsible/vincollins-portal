// components/admin/students/components/StudentHeader.tsx

'use client'

import { motion } from 'framer-motion'
import { Users, Wifi, WifiOff, CircleDot } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ViewModeToggle } from './ViewModeToggle'           // ✅ Same folder
import { AddStudentDialog } from './dialogs/AddStudentDialog'
import { BulkUploadDialog } from './dialogs/BulkUploadDialog'
import type { StudentFormData, Credentials, BulkUploadResult } from '../types'  
interface StudentHeaderProps {
  totalStudents: number
  onlineCount: number
  awayCount: number
  isPresenceConnected: boolean
  isSubmitting: boolean
  onCreateStudent: (data: StudentFormData) => Promise<Credentials | null>
  onCredentialsGenerated: (credentials: Credentials) => void
  onBulkUpload: (file: File) => Promise<BulkUploadResult | null>
  viewMode: 'classes' | 'list'
  setViewMode: (mode: 'classes' | 'list') => void
  onClearSelection: () => void
}

export function StudentHeader({
  totalStudents,
  onlineCount,
  awayCount,
  isPresenceConnected,
  isSubmitting,
  onCreateStudent,
  onCredentialsGenerated,
  onBulkUpload,
  viewMode,
  setViewMode,
  onClearSelection,
}: StudentHeaderProps) {
  return (
    <motion.div
      className="flex flex-wrap justify-between items-start lg:items-center gap-4"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Title & Stats */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Student Management
        </h1>
        
        {/* ✅ FIXED: Changed from <p> to <div> to avoid nesting <div> inside <p> */}
        <div className="text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
          <Users className="h-4 w-4" />
          <span>Total {totalStudents} student{totalStudents !== 1 ? 's' : ''} enrolled</span>

          {isPresenceConnected && (
            <>
              {onlineCount > 0 && (
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                  <Wifi className="h-3 w-3 mr-1" />
                  {onlineCount} online
                </Badge>
              )}
              {awayCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  <CircleDot className="h-3 w-3 mr-1" />
                  {awayCount} away
                </Badge>
              )}
            </>
          )}
          {!isPresenceConnected && (
            <Badge variant="outline" className="text-xs">
              <WifiOff className="h-3 w-3 mr-1" />
              Offline
            </Badge>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <ViewModeToggle
          viewMode={viewMode}
          setViewMode={setViewMode}
          onClearSelection={onClearSelection}
        />

        <BulkUploadDialog
          onBulkUpload={onBulkUpload}
          isSubmitting={isSubmitting}
        />

        <AddStudentDialog
          onCreateStudent={onCreateStudent}
          onCredentialsGenerated={onCredentialsGenerated}
          isSubmitting={isSubmitting}
        />
      </div>
    </motion.div>
  )
}