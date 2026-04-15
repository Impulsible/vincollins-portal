// app/auth/login/page.tsx - Server Component (no 'use client')
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic' // ✅ ADDED

export default function AuthLoginRedirect() {
  redirect('/portal')
}