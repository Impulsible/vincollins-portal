// app/staff/ca-scores/page.tsx - WITH DARK MODE
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

  useEffect(() => {
    if (contextUser) {
      setProfile(contextUser)
    }
  }, [contextUser])

  useEffect(() => {
    let cancelled = false

    async function fetchCurrentTerm() {
      try {
        setError(null)

        const { data: sessionData, error: sessionError } = await supabase
          .from('academic_sessions')
          .select('session_year')
          .eq('is_current', true)
          .maybeSingle()

        if (sessionError) throw sessionError

        const currentSessionYear = sessionData?.session_year ?? null

        let termQuery = supabase
          .from('term_settings')
          .select('term, term_name, session_year')
          .eq('is_current', true)

        if (currentSessionYear) {
          termQuery = termQuery.eq('session_year', currentSessionYear)
        }

        let { data: termData, error: termError } = await termQuery.maybeSingle()

        if (!termData && currentSessionYear) {
          const fallback = await supabase
            .from('term_settings')
            .select('term, term_name, session_year')
            .eq('is_current', true)
            .maybeSingle()

          termData = fallback.data
          termError = fallback.error
        }

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
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600 dark:text-emerald-400 mx-auto" />
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Loading CA Scores...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full px-3 sm:px-4 md:px-5 lg:px-6 py-4">
        <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-red-800 dark:text-red-300">Unable to load current term</h3>
            <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50"
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
            className="text-sm text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="h-3 w-3" /> Back to Dashboard
          </Link>
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">CA Scores</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage continuous assessment scores for your students
            {termInfo && (
              <span className="ml-1 text-emerald-700 dark:text-emerald-400 font-medium">
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