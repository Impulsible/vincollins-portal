// components/admin/students/components/dialogs/DeleteConfirmDialog.tsx

'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  student,
  onConfirm,
  isSubmitting,
}: DeleteConfirmDialogProps) {
  if (!student) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Confirm Deletion
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the
            student account.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-4 border border-red-200">
            <p className="font-medium">Are you sure you want to delete:</p>
            <p className="text-lg font-bold mt-1">{student.full_name}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {student.email}
            </p>
            <p className="text-sm text-muted-foreground">
              VIN: {student.vin_id}
            </p>
            {student.admission_number && (
              <p className="text-sm text-muted-foreground">
                Admission: {student.admission_number}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Student
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}