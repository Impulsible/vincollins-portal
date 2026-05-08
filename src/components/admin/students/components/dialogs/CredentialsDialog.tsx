// components/admin/students/components/dialogs/CredentialsDialog.tsx

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
import { Copy, CheckCircle, Shield } from 'lucide-react'
import { Credentials } from '../../types'
import { copyToClipboard } from '../../utils'

interface CredentialsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  credentials: Credentials | null
}

export function CredentialsDialog({
  open,
  onOpenChange,
  credentials,
}: CredentialsDialogProps) {
  if (!credentials) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
            Student Account Created!
          </DialogTitle>
          <DialogDescription>
            Save these credentials. The student will use these to log in.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted rounded-lg p-4 space-y-3">
            {/* Email */}
            <CredentialRow
              label="Email Address"
              value={credentials.email}
              onCopy={() => copyToClipboard(credentials.email, 'Email')}
            />

            {/* Password / VIN ID */}
            <CredentialRow
              label="VIN ID / Password"
              value={credentials.password}
              onCopy={() => copyToClipboard(credentials.password, 'Password')}
              valueClassName="text-primary font-bold"
            />

            {/* Admission Number */}
            <div className="pt-3 border-t">
              <CredentialRow
                label="Admission Number"
                value={credentials.admission_number}
                onCopy={() =>
                  copyToClipboard(credentials.admission_number, 'Admission Number')
                }
                valueClassName="text-emerald-600 font-bold"
              />
            </div>
          </div>

          {/* Note */}
          <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3 border border-amber-200">
            <p className="text-xs text-amber-800 flex items-center gap-2">
              <Shield className="h-3 w-3" />
              <strong>Note:</strong> Student will use admission number for CBT
              exams and report cards. They will be prompted to change password on
              first login.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CredentialRow({
  label,
  value,
  onCopy,
  valueClassName,
}: {
  label: string
  value: string
  onCopy: () => void
  valueClassName?: string
}) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`font-mono text-sm ${valueClassName || ''}`}>{value}</p>
      </div>
      <Button variant="ghost" size="sm" onClick={onCopy}>
        <Copy className="h-3 w-3" />
      </Button>
    </div>
  )
}