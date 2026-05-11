// components/layout/header/SignOutDialog.tsx
'use client'

import { memo } from 'react'
import { LogOut } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

interface SignOutDialogProps {
  open: boolean
  onClose: () => void
  onLogout?: () => void
}

export const SignOutDialog = memo(function SignOutDialog({ open, onClose, onLogout }: SignOutDialogProps) {
  const handleSignOut = () => {
    onClose()
    window.location.href = '/portal'
    onLogout?.()
  }

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="rounded-2xl max-w-[90vw] sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
              <LogOut className="h-4 w-4 text-red-600" />
            </div>
            Sign Out?
          </AlertDialogTitle>
          <AlertDialogDescription>Are you sure you want to sign out of your account?</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel className="rounded-xl text-sm">Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSignOut} className="rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm">
            <LogOut className="mr-2 h-4 w-4" />Sign Out
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
})