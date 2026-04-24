// src/components/staff/exams/GrantAttemptDialog.tsx - FULLY RESPONSIVE
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
import { Loader2, RefreshCw, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GrantAttemptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  studentName: string
  currentAttempt: number
  maxAttempts: number
  onConfirm: (reason: string) => Promise<void>
  loading?: boolean
  examTitle?: string
}

export function GrantAttemptDialog({
  open,
  onOpenChange,
  studentName,
  currentAttempt,
  maxAttempts,
  onConfirm,
  loading = false,
  examTitle
}: GrantAttemptDialogProps) {
  const [reason, setReason] = useState('')
  const [reasonType, setReasonType] = useState('technical')

  const reasonOptions = [
    { value: 'technical', label: 'Technical Issue During Exam', description: 'Network issues, system crash, or power outage' },
    { value: 'accommodation', label: 'Special Accommodation', description: 'Extended time or additional needs' },
    { value: 'retake', label: 'Retake for Grade Improvement', description: 'Student requests to improve score' },
    { value: 'appeal', label: 'Appeal Approved', description: 'Grade appeal approved by administration' },
    { value: 'other', label: 'Other', description: 'Other valid reason' }
  ]

  const handleConfirm = async () => {
    const finalReason = `[${reasonType.toUpperCase()}] ${reason || 'No additional details provided'}`
    await onConfirm(finalReason)
  }

  const newAttemptNumber = currentAttempt + 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md rounded-xl p-0 overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-6 pt-5 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
            </div>
            Grant Additional Attempt
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm mt-1.5">
            Allow <span className="font-semibold text-foreground">{studentName}</span> to take 
            {examTitle ? (
              <span className="font-medium ml-1">"{examTitle}"</span>
            ) : (
              <span> this exam</span>
            )} again.
          </DialogDescription>
        </div>

        {/* Content */}
        <div className="space-y-4 sm:space-y-5 px-4 sm:px-6 py-2">
          {/* Attempt Info Card - Responsive */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-3 sm:p-4 rounded-xl border border-blue-100 dark:border-blue-800">
            <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3">
              <div className="flex-1 text-center xs:text-left">
                <p className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wide">
                  Current Attempts
                </p>
                <div className="flex items-center justify-center xs:justify-start gap-2 mt-0.5">
                  <span className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-300">{currentAttempt}</span>
                  <span className="text-sm text-blue-400">of</span>
                  <span className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-300">{maxAttempts}</span>
                </div>
              </div>
              <div className="hidden xs:block w-px h-10 bg-blue-200 dark:bg-blue-800" />
              <div className="flex-1 text-center xs:text-left">
                <p className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wide">
                  After Grant
                </p>
                <div className="flex items-center justify-center xs:justify-start gap-2 mt-0.5">
                  <span className="text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-300">{newAttemptNumber}</span>
                  <span className="text-sm text-emerald-400">of</span>
                  <span className="text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-300">{newAttemptNumber}</span>
                </div>
              </div>
            </div>
            {/* Progress Bar */}
            <div className="mt-3">
              <div className="w-full bg-blue-100 dark:bg-blue-900/50 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-emerald-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${(currentAttempt / maxAttempts) * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground text-center mt-1">
                {currentAttempt} of {maxAttempts} attempts used
              </p>
            </div>
          </div>

          {/* Reason Selection - Mobile Optimized */}
          <div>
            <Label className="text-sm font-medium mb-2 block items-center gap-1">
              Reason for granting additional attempt
              <span className="text-red-500">*</span>
            </Label>
            <RadioGroup value={reasonType} onValueChange={setReasonType} className="space-y-2">
              {reasonOptions.map(opt => (
                <label 
                  key={opt.value} 
                  className={cn(
                    "flex cursor-pointer rounded-lg border-2 p-3 transition-all",
                    reasonType === opt.value 
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" 
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                  )}
                >
                  <div className="flex items-start gap-3 w-full">
                    <RadioGroupItem value={opt.value} id={opt.value} className="mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <Label htmlFor={opt.value} className="text-sm font-medium cursor-pointer">
                        {opt.label}
                      </Label>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                        {opt.description}
                      </p>
                    </div>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>

          {/* Additional Notes */}
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Additional Notes (Optional)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter any additional details or comments..."
              className="text-sm min-h-[80px] resize-none"
              rows={3}
            />
          </div>

          {/* Warning Alert - Responsive */}
          <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg flex items-start gap-2.5 border border-amber-200 dark:border-amber-800">
            <div className="h-5 w-5 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                This action will be logged
              </p>
              <p className="text-[10px] sm:text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                The reason and timestamp will be recorded for administrative review.
              </p>
            </div>
          </div>
        </div>

        {/* Footer - Mobile Optimized Buttons */}
        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 px-4 sm:px-6 py-4 border-t bg-slate-50 dark:bg-slate-900/50 mt-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            className="h-9 sm:h-10 text-sm w-full sm:w-auto order-2 sm:order-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={loading} 
            className="bg-blue-600 hover:bg-blue-700 h-9 sm:h-10 text-sm w-full sm:w-auto order-1 sm:order-2"
          >
            {loading ? (
              <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Granting...</>
            ) : (
              <><RefreshCw className="mr-2 h-3.5 w-3.5" /> Grant Attempt {newAttemptNumber}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}