// app/student/classmates/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { StudentSidebar } from '@/components/student/StudentSidebar'
import { StudentClassRoster } from '@/components/student/StudentClassRoster'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { ArrowLeft, Home } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

export default function StudentClassmatesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/portal')
        return
      }

      // ✅ Fetch all name fields including display_name
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      setProfile(profileData)
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/portal')
  }

  const formatProfileForHeader = (profile: any) => {
    if (!profile) return undefined
    return {
      id: profile.id,
      // ✅ Use display_name for header
      name: profile.display_name || profile.full_name,
      email: profile.email,
      role: 'student' as const,
      avatar: profile.photo_url || undefined,
      isAuthenticated: true
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <Header onLogout={handleLogout} />
        <div className="flex">
          <div className="hidden lg:block w-72" />
          <div className="flex-1">
            <main className="pt-20 lg:pt-24 pb-8">
              <div className="container mx-auto px-4">
                <div className="space-y-6">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-96 w-full rounded-xl" />
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col overflow-x-hidden w-full">
      <Header user={formatProfileForHeader(profile)} onLogout={handleLogout} />
      
      <div className="flex flex-1 w-full overflow-x-hidden">
        <StudentSidebar 
          profile={profile}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeTab="classmates"
          setActiveTab={() => {}}
        />

        <div className={cn(
          "flex-1 transition-all duration-300 w-full overflow-x-hidden",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
        )}>
          <main className="pt-16 lg:pt-20 pb-12 px-4 sm:px-6 lg:px-8 w-full overflow-x-hidden">
            <div className="max-w-5xl mx-auto">
              
              {/* Breadcrumb */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Link href="/student" className="hover:text-primary flex items-center gap-1">
                      <Home className="h-3.5 w-3.5" />
                      Dashboard
                    </Link>
                    <span>/</span>
                    <span className="text-foreground font-medium">Classmates</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => router.push('/student')}>
                    <ArrowLeft className="mr-2 h-3.5 w-3.5" />
                    Back
                  </Button>
                </div>
              </motion.div>

              {/* Page Title */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">My Classmates</h1>
                <p className="text-slate-500 mt-1">
                  Students in {profile?.class} • Get to know your classmates
                </p>
              </motion.div>

              {/* Classmates Roster */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <StudentClassRoster 
                  studentClass={profile?.class}
                  studentId={profile?.id}
                  compact={false}
                  onClassmateClick={(classmate) => {
                    console.log('Clicked classmate:', classmate)
                  }}
                />
              </motion.div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}