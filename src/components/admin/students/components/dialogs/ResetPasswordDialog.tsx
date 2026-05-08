// components/admin/students/components/dialogs/ResetPasswordDialog.tsx

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
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Copy } from 'lucide-react'
import { Student } from '../../types'
import { copyToClipboard } from '../../utils'

interface ResetPasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: Student | null
}

export function ResetPasswordDialog({
  open,
  onOpenChange,
  student,
}: ResetPasswordDialogProps) {
  if (!student) return null

  const newPassword = student.vin_id

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Password Reset
          </DialogTitle>
          <DialogDescription>
            Password has been reset to the VIN ID.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="text-xs text-muted-foreground">Student</p>
                <p className="font-medium">{student.full_name}</p>
              </div>
              <Badge variant="secondary">{student.vin_id}</Badge>
            </div>
            <div className="pt-3 border-t">
              <p className="text-xs text-muted-foreground">New Password</p>
              <div className="flex justify-between items-center mt-1">
                <p className="font-mono text-lg font-bold text-primary">
                  {newPassword}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(newPassword, 'Password')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}