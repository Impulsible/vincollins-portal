// components/admin/students/components/dialogs/DeleteConfirmDialog.tsx - WITH DARK MODE
'use client'

import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertCircle, Loader2 } from 'lucide-react'
import { Student } from '../../types'

interface DeleteConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: Student | null
  onConfirm: () => Promise<void>
  isSubmitting: boolean
}

export function DeleteConfirmDialog({ open, onOpenChange, student, onConfirm, isSubmitting }: DeleteConfirmDialogProps) {
  if (!student) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="h-5 w-5" />
            Confirm Deletion
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400">
            This action cannot be undone. This will permanently delete the student account.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-4 border border-red-200 dark:border-red-900/50">
            <p className="font-medium text-slate-800 dark:text-slate-200">Are you sure you want to delete:</p>
            <p className="text-lg font-bold mt-1 text-slate-900 dark:text-white">{student.full_name}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{student.email}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">VIN: {student.vin_id}</p>
            {student.admission_number && <p className="text-sm text-slate-500 dark:text-slate-400">Admission: {student.admission_number}</p>}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">Cancel</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700 text-white">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Student
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}