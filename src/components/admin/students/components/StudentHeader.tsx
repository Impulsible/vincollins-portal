// components/admin/students/components/StudentHeader.tsx

'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Users, LayoutGrid, List, Filter } from 'lucide-react'
import { AddStudentDialog } from './dialogs/AddStudentDialog'
import { BulkUploadDialog } from './dialogs/BulkUploadDialog'
import { cn } from '@/lib/utils'

interface StudentHeaderProps {
  totalStudents: number
  onlineCount: number
  awayCount: number
  isPresenceConnected: boolean
  isSubmitting: boolean
  onCreateStudent: (formData: any) => Promise<any>
  onCredentialsGenerated: (credentials: any) => void
  onBulkUpload: (file: File) => Promise<any>  // This is the prop name
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
    <div className="space-y-4">
      {/* Header Title and Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Student Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            {totalStudents} student{totalStudents !== 1 ? 's' : ''} enrolled
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-3">
          <AddStudentDialog
            onCreateStudent={onCreateStudent}
            onCredentialsGenerated={onCredentialsGenerated}
            isSubmitting={isSubmitting}
          />
          <BulkUploadDialog
            onBulkUpload={onBulkUpload}  // Use onBulkUpload (not onUpload)
            isSubmitting={isSubmitting}
          />
        </div>
      </div>

      {/* View Toggle Card */}
      <Card className="border shadow-sm">
        <CardContent className="p-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'classes' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('classes')}
                className={cn(
                  "h-9 px-4",
                  viewMode === 'classes' && "bg-emerald-600 hover:bg-emerald-700"
                )}
              >
                <LayoutGrid className="h-4 w-4 mr-2" />
                Class View
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={cn(
                  "h-9 px-4",
                  viewMode === 'list' && "bg-emerald-600 hover:bg-emerald-700"
                )}
              >
                <List className="h-4 w-4 mr-2" />
                List View
              </Button>
              {viewMode === 'list' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearSelection}
                  className="h-9 px-3 text-slate-500"
                >
                  <Filter className="h-4 w-4 mr-1" />
                  Clear Filters
                </Button>
              )}
            </div>
            
            {/* Stats Summary */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-slate-400" />
                <span className="font-medium text-slate-700">{totalStudents}</span>
                <span className="text-slate-500">total</span>
              </div>
              {isPresenceConnected && (
                <>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="font-medium text-green-600">{onlineCount}</span>
                    <span className="text-slate-500">online</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 bg-amber-500 rounded-full" />
                    <span className="font-medium text-amber-600">{awayCount}</span>
                    <span className="text-slate-500">away</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}