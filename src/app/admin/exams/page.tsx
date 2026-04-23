/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/admin/exams/page.tsx - EXAM APPROVALS PAGE
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { ExamApprovals } from '@/components/admin/exams/ExamApprovals'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  Loader2, Shield, ArrowLeft, Home, ChevronRight
} from 'lucide-react'
import Link from 'next/link'

// ========== TYPES ==========
interface Exam {
  id: string
  title: string
  subject: string
  class: string
  duration: number
  total_questions: number
  total_marks: number
  pass_mark: number
  status: string
  created_at: string
  submitted_at: string
  approved_at?: string
  created_by: string
  teacher_name?: string
  department?: string
  instructions?: string
  has_theory?: boolean
}

interface AdminProfile {
  id: string
  full_name: string
  email: string
  role: string
  photo_url?: string
}

// ========== MAIN COMPONENT ==========
export default function AdminExamsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authChecking, setAuthChecking] = useState(true)
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  
  const [pendingExams, setPendingExams] = useState<Exam[]>([])
  const [approvedExams, setApprovedExams] = useState<Exam[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const formatProfileForHeader = (profile: AdminProfile | null) => {
    if (!profile) return undefined
    return {
      id: profile.id,
      name: profile.full_name || profile.email?.split('@')[0] || 'Administrator',
      email: profile.email,
      role: profile.role === 'staff' ? 'teacher' as const : 'admin' as const,
      avatar: profile.photo_url,
      isAuthenticated: true
    }
  }

  function formatFullName(name: string): string {
    if (!name) return ''
    const words = name.split(/[\s._-]+/)
    const formattedWords = words.map(word => {
      if (word.length === 0) return ''
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    return formattedWords.join(' ')
  }

  // ========== AUTH CHECK ==========
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session?.user) {
          toast.error('Please log in to continue')
          router.push('/portal')
          return
        }

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role, full_name, email, photo_url')
          .eq('id', session.user.id)
          .single()

        if (profileError || !profileData) {
          toast.error('Account not found')
          router.push('/portal')
          return
        }

        const role = profileData.role?.toLowerCase()
        if (role !== 'admin' && role !== 'staff') {
          toast.error('Access denied. Admin only.')
          router.push('/portal')
          return
        }

        const rawFullName = profileData.full_name || session.user.email?.split('@')[0] || 'Administrator'
        setProfile({
          id: session.user.id,
          email: session.user.email || '',
          full_name: formatFullName(rawFullName),
          role: role,
          photo_url: profileData.photo_url
        })

        setAuthChecking(false)
      } catch (err) {
        console.error('Auth check error:', err)
        toast.error('Authentication error')
        router.push('/portal')
      }
    }

    checkAuth()
  }, [router])

  // ========== LOAD EXAMS ==========
  const loadExams = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push('/portal')
        return
      }

      // Get all exams
      const { data: examsData, error: examsError } = await supabase
        .from('exams')
        .select(`
          *,
          profiles!exams_created_by_fkey(full_name, department)
        `)
        .order('created_at', { ascending: false })

      if (examsError) throw examsError

      const formattedExams = (examsData || []).map((exam: any) => ({
        ...exam,
        teacher_name: exam.profiles?.full_name || 'Unknown Teacher',
        department: exam.profiles?.department || 'General'
      }))

      // Split into pending and approved
      const pending = formattedExams.filter((e: Exam) => 
        e.status === 'pending' || e.status === 'draft' || e.status === 'submitted'
      )
      const approved = formattedExams.filter((e: Exam) => 
        e.status === 'published' || e.status === 'approved'
      )

      setPendingExams(pending)
      setApprovedExams(approved)

    } catch (error: any) {
      console.error('Error loading exams:', error)
      toast.error('Failed to load exams')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [router])

  useEffect(() => {
    if (!authChecking) {
      loadExams()
    }
    
    // Real-time subscription
    const channel = supabase
      .channel('exams-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exams' }, () => {
        loadExams()
      })
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadExams, authChecking])

  // ========== HANDLERS ==========
  const handleApprove = async (examId: string) => {
    try {
      const { error } = await supabase
        .from('exams')
        .update({ 
          status: 'published',
          approved_at: new Date().toISOString(),
          approved_by: profile?.id
        })
        .eq('id', examId)

      if (error) throw error

      toast.success('Exam approved and published successfully!')
      await loadExams()
    } catch (error: any) {
      console.error('Error approving exam:', error)
      toast.error(error.message || 'Failed to approve exam')
      throw error
    }
  }

  const handleReject = async (examId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('exams')
        .update({ 
          status: 'draft',
          rejection_reason: reason,
          rejected_at: new Date().toISOString(),
          rejected_by: profile?.id
        })
        .eq('id', examId)

      if (error) throw error

      toast.success('Exam sent back for revision')
      await loadExams()
    } catch (error: any) {
      console.error('Error rejecting exam:', error)
      toast.error(error.message || 'Failed to reject exam')
      throw error
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadExams()
    toast.success('Data refreshed')
  }

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut()
    router.push('/portal')
  }, [router])

  // ========== LOADING STATE ==========
  if (authChecking || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-x-hidden">
        <Header user={formatProfileForHeader(profile)} onLogout={handleLogout} />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Shield className="h-16 w-16 text-purple-600 mx-auto" />
            </motion.div>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-4 text-slate-600 dark:text-slate-300 text-lg font-medium"
            >
              Loading Exam Approvals...
            </motion.p>
            <div className="flex justify-center gap-1 mt-4">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="h-2 w-2 rounded-full bg-purple-400"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ========== MAIN RENDER ==========
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-x-hidden">
      <Header user={formatProfileForHeader(profile)} onLogout={handleLogout} />
      
      <div className="flex overflow-x-hidden">
        <AdminSidebar
          profile={profile}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeTab="exams"
          setActiveTab={() => {}}
        />
        
        <main className={cn(
          "flex-1 pt-16 lg:pt-20 pb-8 min-h-screen transition-all duration-300 overflow-x-hidden",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
        )}>
          <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 max-w-full overflow-x-hidden">
            
            {/* Breadcrumb */}
            <div className="mb-4 sm:mb-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/admin" className="hover:text-primary flex items-center gap-1">
                <Home className="h-3.5 w-3.5" />
                Dashboard
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-foreground font-medium">Exam Approvals</span>
            </div>

            {/* Back Button */}
            <div className="mb-4">
              <Button variant="outline" size="sm" onClick={() => router.push('/admin')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>

            {/* Main Content */}
            <ExamApprovals
              pendingExams={pendingExams}
              approvedExams={approvedExams}
              onApprove={handleApprove}
              onReject={handleReject}
              loading={refreshing}
              onRefresh={handleRefresh}
            />
          </div>
        </main>
      </div>
    </div>
  )
}