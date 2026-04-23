// src/components/staff/exams/GrantAttemptDialog.tsx
'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react'

interface GrantAttemptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  studentName: string
  currentAttempt: number
  maxAttempts: number
  onConfirm: (reason: string) => Promise<void>
  loading?: boolean
}

export function GrantAttemptDialog({
  open,
  onOpenChange,
  studentName,
  currentAttempt,
  maxAttempts,
  onConfirm,
  loading = false
}: GrantAttemptDialogProps) {
  const [reason, setReason] = useState('')
  const [reasonType, setReasonType] = useState('technical')

  const reasonOptions = [
    { value: 'technical', label: 'Technical Issue During Exam' },
    { value: 'accommodation', label: 'Special Accommodation' },
    { value: 'retake', label: 'Retake for Grade Improvement' },
    { value: 'appeal', label: 'Appeal Approved' },
    { value: 'other', label: 'Other' }
  ]

  const handleConfirm = async () => {
    const finalReason = `[${reasonType.toUpperCase()}] ${reason || 'No additional details provided'}`
    await onConfirm(finalReason)
  }

  const newAttemptNumber = currentAttempt + 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Grant Additional Attempt
          </DialogTitle>
          <DialogDescription>
            Allow <span className="font-semibold">{studentName}</span> to take this exam again.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600 dark:text-slate-400">Current Attempts:</span>
              <span className="font-medium">{currentAttempt} of {maxAttempts}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">After Grant:</span>
              <span className="font-medium text-blue-600">{newAttemptNumber} of {newAttemptNumber}</span>
            </div>
          </div>

          <div>
            <Label>Reason for granting additional attempt</Label>
            <RadioGroup value={reasonType} onValueChange={setReasonType} className="grid gap-2 mt-2">
              {reasonOptions.map(opt => (
                <div key={opt.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={opt.value} id={opt.value} />
                  <Label htmlFor={opt.value} className="text-sm cursor-pointer">{opt.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label>Additional Notes</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter any additional details (optional)..."
              className="mt-2"
              rows={3}
            />
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800 dark:text-amber-300">
              This action will be logged and can be reviewed by administrators.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Granting...</>
            ) : (
              <><RefreshCw className="mr-2 h-4 w-4" /> Grant Attempt {newAttemptNumber}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}