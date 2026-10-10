// app/staff/ca-scores/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/contexts/UserContext'
import { AuthGuard } from '@/components/AuthGuard'
import { CAScoresTab } from '@/components/staff/ca-scores/CAScoresTab'
import { Loader2, ArrowLeft, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface TermInfo {
  termCode: string
  sessionYear: string
  termName: string
}

function CAScoresContent() {
  const router = useRouter()
  const { user: contextUser } = useUser()
  const [profile, setProfile] = useState<any>(null)
  const [termInfo, setTermInfo] = useState<TermInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const lastVisibilityRef = useRef(0)

  // 1. Set profile from context
  useEffect(() => {
    if (contextUser) {
      setProfile(contextUser)
    }
  }, [contextUser])

  // 2. Fetch current term + current session from database
  useEffect(() => {
    let cancelled = false

    async function fetchCurrentTerm() {
      try {
        setError(null)

        // --- Step 1: Get the current academic session ---
        const { data: sessionData, error: sessionError } = await supabase
          .from('academic_sessions')
          .select('session_year')
          .eq('is_current', true)
          .maybeSingle()

        if (sessionError) throw sessionError

        const currentSessionYear = sessionData?.session_year ?? null

        // --- Step 2: Get the current term ---
        // Prefer term_settings, scoped to the current session if we have it.
        let termQuery = supabase
          .from('term_settings')
          .select('term, term_name, session_year')
          .eq('is_current', true)

        if (currentSessionYear) {
          termQuery = termQuery.eq('session_year', currentSessionYear)
        }

        let { data: termData, error: termError } = await termQuery.maybeSingle()

        // Fallback: if nothing matched the session filter, retry without it
        if (!termData && currentSessionYear) {
          const fallback = await supabase
            .from('term_settings')
            .select('term, term_name, session_year')
            .eq('is_current', true)
            .maybeSingle()

          termData = fallback.data
          termError = fallback.error
        }

        // Final fallback: use `terms` table
        if (!termData) {
          const termsFallback = await supabase
            .from('terms')
            .select('term_code, term_name, session_year')
            .eq('is_current', true)
            .maybeSingle()

          if (termsFallback.data) {
            if (!cancelled) {
              setTermInfo({
                termCode: termsFallback.data.term_code ?? '',
                sessionYear: termsFallback.data.session_year ?? currentSessionYear ?? '',
                termName: termsFallback.data.term_name ?? '',
              })
            }
            return
          }
        }

        if (termError) throw termError

        if (!termData) {
          throw new Error(
            'No current term is set. Please ask an admin to mark a term as current in term_settings.'
          )
        }

        if (!cancelled) {
          setTermInfo({
            termCode: termData.term ?? '',
            sessionYear: termData.session_year ?? currentSessionYear ?? '',
            termName: termData.term_name ?? '',
          })
        }
      } catch (err: any) {
        console.error('Error fetching current term:', err)
        if (!cancelled) {
          setError(err.message || 'Failed to load current term.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchCurrentTerm()

    return () => {
      cancelled = true
    }
  }, [])

  // 3. Visibility refresh hook (unchanged)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (Date.now() - lastVisibilityRef.current > 120000) {
          lastVisibilityRef.current = Date.now()
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mx-auto" />
          <p className="mt-3 text-sm text-slate-500">Loading CA Scores...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full px-3 sm:px-4 md:px-5 lg:px-6 py-4">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-red-800">Unable to load current term</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-hidden">
      <div className="w-full px-3 sm:px-4 md:px-5 lg:px-6 py-4 sm:py-5 space-y-4">
        <div className="flex items-center gap-2">
          <Link
            href="/staff"
            className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
          >
            <ArrowLeft className="h-3 w-3" /> Back to Dashboard
          </Link>
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">CA Scores</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage continuous assessment scores for your students
            {termInfo && (
              <span className="ml-1 text-emerald-700 font-medium">
                — {termInfo.termName} {termInfo.sessionYear}
              </span>
            )}
          </p>
        </div>
        {profile && termInfo && (
          <CAScoresTab staffProfile={profile} termInfo={termInfo} />
        )}
      </div>
    </div>
  )
}

export default function CAScoresPage() {
  return (
    <AuthGuard allowedRoles={['staff', 'admin', 'teacher']}>
      <CAScoresContent />
    </AuthGuard>
  )
}