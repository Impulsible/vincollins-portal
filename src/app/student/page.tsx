/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/student/classmates/page.tsx - FIXED SIDEBAR PROFILE DATA
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { StudentSidebar } from '@/components/student/StudentSidebar'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ArrowLeft, Users } from 'lucide-react'
import { StudentClassRoster } from '@/components/student/StudentClassRoster'

interface StudentProfile {
  id: string
  first_name: string | null
  middle_name?: string | null
  last_name: string | null
  full_name: string
  display_name?: string | null
  email: string
  class: string
  photo_url?: string | null
  vin_id?: string | null  // ✅ Allow null
  department?: string | null
  admission_year?: number | null  // ✅ Allow null
}

function StudentClassmatesContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/portal')
          return
        }

        // ✅ Fetch ALL profile fields
        const { data: profileData } = await supabase
          .from('profiles')
          .select(`
            id, 
            first_name, 
            middle_name, 
            last_name, 
            full_name, 
            display_name, 
            email, 
            class, 
            photo_url, 
            vin_id, 
            department, 
            admission_year,
            role
          `)
          .eq('id', user.id)
          .single()

        if (profileData) {
          console.log('📋 Profile data fetched:', profileData) // Debug log
          
          setProfile({
            id: profileData.id,
            first_name: profileData.first_name,
            middle_name: profileData.middle_name,
            last_name: profileData.last_name,
            full_name: profileData.full_name || `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim(),
            display_name: profileData.display_name,
            email: profileData.email,
            class: profileData.class,
            photo_url: profileData.photo_url,
            vin_id: profileData.vin_id,  // ✅ Pass VIN ID
            department: profileData.department,
            admission_year: profileData.admission_year  // ✅ Pass admission year
          })
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
        toast.error('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: 'local' })
    toast.success('Logged out successfully')
    router.push('/portal')
  }

  const formatProfileForHeader = (profile: StudentProfile | null) => {
    if (!profile) return undefined
    return {
      id: profile.id,
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
        <Header user={formatProfileForHeader(profile)} onLogout={handleLogout} />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Users className="h-12 w-12 text-emerald-600 mx-auto" />
            </motion.div>
            <p className="mt-4 text-slate-600 text-lg font-medium">Loading Classmates...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Header user={formatProfileForHeader(profile)} onLogout={handleLogout} />
      
      <div className="flex">
        {/* ✅ Pass FULL profile to sidebar */}
        <StudentSidebar 
          profile={profile}  // Now includes vin_id and admission_year
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeTab="classmates"
          setActiveTab={(tab) => {
            if (tab === 'overview') router.push('/student')
            else if (tab === 'exams') router.push('/student/exams')
            else if (tab === 'results') router.push('/student/results')
            else if (tab === 'assignments') router.push('/student/assignments')
            else if (tab === 'courses') router.push('/student/courses')
            else if (tab === 'classmates') router.push('/student/classmates')
            else if (tab === 'report-card') router.push('/student/report-card')
            else if (tab === 'profile') router.push('/student/profile')
            else if (tab === 'notifications') router.push('/student/notifications')
            else if (tab === 'settings') router.push('/student/settings')
            else if (tab === 'help') router.push('/student/help')
          }}
        />

        <main className={cn(
          "flex-1 pt-16 lg:pt-20 pb-8 min-h-screen transition-all duration-300",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
        )}>
          <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 max-w-6xl">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                  <Users className="h-6 w-6 text-emerald-600" />
                  Class Roster
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  View all students in {profile?.class || 'your class'}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => router.push('/student')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>

            {/* Class Roster */}
            <StudentClassRoster 
              studentClass={profile?.class}
              studentId={profile?.id}
              compact={false}
            />

          </div>
        </main>
      </div>
    </div>
  )
}

export default function StudentClassmatesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Users className="h-12 w-12 text-emerald-600 mx-auto" />
          </motion.div>
          <p className="mt-4 text-slate-600 text-lg font-medium">Loading Classmates...</p>
        </div>
      </div>
    }>
      <StudentClassmatesContent />
    </Suspense>
  )
}