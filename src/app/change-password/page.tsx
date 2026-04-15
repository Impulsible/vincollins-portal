// app/change-password/page.tsx

import { Suspense } from 'react'
import ChangePasswordForm from './ChangePasswordForm'
import { Loader2 } from 'lucide-react'

export default function ChangePasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ChangePasswordForm />
    </Suspense>
  )
}