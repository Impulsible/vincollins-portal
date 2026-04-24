// src/components/staff/exams/DeleteExamDialog.tsx - FULLY RESPONSIVE
'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AlertTriangle } from 'lucide-react'

interface DeleteExamDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  examTitle?: string
  onConfirm: () => void
}

export function DeleteExamDialog({ open, onOpenChange, examTitle, onConfirm }: DeleteExamDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="w-[90vw] max-w-md sm:max-w-lg p-4 sm:p-6 gap-3 sm:gap-4">
        <AlertDialogHeader className="space-y-2 sm:space-y-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />
            </div>
            <AlertDialogTitle className="text-base sm:text-lg md:text-xl">
              Delete Exam
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-xs sm:text-sm md:text-base">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-foreground">{examTitle || 'this exam'}</span>
            ? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3 mt-2">
          <AlertDialogCancel className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm} 
            className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm bg-red-600 hover:bg-red-700 text-white"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}