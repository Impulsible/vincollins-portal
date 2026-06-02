// app/student/classmates/page.tsx - UPDATED WITH FUN THEME
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/contexts/UserContext'
import { instantLogout, getCachedHeaderUser } from '@/lib/auth-utils'
import { Header, HeaderUser } from '@/components/layout/header'
import { StudentSidebar } from '@/components/student/StudentSidebar'
import { StudentClassRoster } from '@/components/student/StudentClassRoster'
import { cn } from '@/lib/utils'
import { ArrowLeft, Home, Users, ChevronRight, GraduationCap, Sparkles, Heart, Star, Smile } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

// Get cached user synchronously
const cachedHeaderUser = getCachedHeaderUser()

// ============================================
// FUN LOADING COMPONENT
// ============================================
function ClassmatesLoadingScreen() {
  const funMessages = [
    "Rounding up your classmates... 👥",
    "Making new friends... 🤝",
    "Building your study squad... 📚",
    "Getting to know everyone... 💫",
    "Connecting you with peers... 🔗",
  ]
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % funMessages.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-emerald-700 to-teal-700 h-16 sm:h-[72px] flex items-center px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between w-full max-w-[1440px] mx-auto">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 sm:h-8 sm:w-8 bg-white/20 rounded animate-pulse" />
            <div className="h-4 w-24 sm:h-5 sm:w-32 bg-white/20 rounded animate-pulse hidden sm:block" />
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-8 w-8 sm:h-9 sm:w-9 bg-white/20 rounded-full animate-pulse" />
            <div className="h-8 w-8 sm:h-9 sm:w-9 bg-white/20 rounded-full animate-pulse hidden sm:block" />
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-center min-h-screen px-4 pt-16 sm:pt-[72px]">
        <div className="text-center">
          <div className="relative">
            <div className="w-14 h-14 sm:w-16 sm:h-16 border-3 sm:border-4 border-emerald-200 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Users className="h-6 w-6 sm:h-7 sm:w-7 text-emerald-600 animate-pulse" />
            </div>
          </div>
          <p className="mt-3 sm:mt-4 text-slate-600 text-base sm:text-lg font-medium">
            {funMessages[messageIndex]}
          </p>
          <p className="mt-1 sm:mt-2 text-slate-500 text-xs sm:text-sm flex items-center justify-center gap-1">
            <Heart className="h-3 w-3 text-red-400 animate-pulse" />
            Building your learning community
            <Star className="h-3 w-3 text-amber-400 animate-pulse" />
          </p>
        </div>
      </div>
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function StudentClassmatesPage() {
  const router = useRouter()
  const { user: contextUser, loading: authLoading, isAuthenticated } = useUser()
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showContent, setShowContent] = useState(false)

  // Build header user
  const headerUser: HeaderUser | undefined = useMemo(() => {
    if (contextUser) {
      return {
        id: contextUser.id,
        name: contextUser.full_name || contextUser.first_name || 'Student',
        firstName: contextUser.first_name || contextUser.full_name?.split(' ')[0] || 'Student',
        email: contextUser.email || '',
        role: 'student' as const,
        avatar: contextUser.avatar_url || contextUser.photo_url || undefined,
        isAuthenticated: true
      }
    }
    return cachedHeaderUser || undefined
  }, [contextUser])

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!contextUser?.id) {
        setLoading(false)
        return
      }

      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', contextUser.id)
          .single()

        setProfile(profileData)
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [contextUser?.id])

  // Wait for auth to resolve
  useEffect(() => {
    if (!authLoading && (isAuthenticated !== undefined)) {
      const timer = setTimeout(() => {
        setShowContent(true)
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [authLoading, isAuthenticated])

  // Auth redirect check
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !contextUser) {
        if (!cachedHeaderUser) {
          router.replace('/portal')
        }
        return
      }
      
      const userRole = contextUser.role?.toLowerCase()
      if (userRole !== 'student') {
        router.replace('/portal')
        return
      }
    }
  }, [authLoading, isAuthenticated, contextUser, router])

  const handleLogout = () => instantLogout()

  // Show loading screen
  if (!showContent || authLoading || loading) {
    return <ClassmatesLoadingScreen />
  }

  // Auth checks
  if (!isAuthenticated || !contextUser) return null
  if (contextUser.role?.toLowerCase() !== 'student') return null

  const userClass = profile?.class || contextUser?.class || ''

  // Fun facts based on class
  const getClassFunFact = (className: string) => {
    const facts: Record<string, { emoji: string; fact: string }> = {
      'JSS1': { emoji: '🌱', fact: 'Starting your journey!' },
      'JSS2': { emoji: '📈', fact: 'Growing stronger!' },
      'JSS3': { emoji: '🚀', fact: 'Preparing for takeoff!' },
      'SS1': { emoji: '💪', fact: 'Building foundations!' },
      'SS2': { emoji: '🎯', fact: 'Locking in goals!' },
      'SS3': { emoji: '🏆', fact: 'Final stretch champions!' },
    }
    return facts[className] || { emoji: '🌟', fact: 'Keep shining!' }
  }

  const classFunFact = userClass ? getClassFunFact(userClass) : { emoji: '🌟', fact: 'Keep shining!' }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Header user={headerUser} onLogout={handleLogout} />
      
      <div className="flex">
        {/* Sidebar */}
        <StudentSidebar 
          profile={profile || contextUser}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeTab="classmates"
          setActiveTab={() => {}}
        />

        {/* Main Content */}
        <div className={cn(
          "flex-1 min-w-0 transition-all duration-300",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
        )}>
          <main className="pt-[72px] lg:pt-24 pb-12">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="max-w-6xl mx-auto">
                
                {/* Breadcrumb Navigation */}
                <motion.nav 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6"
                >
                  <Link 
                    href="/student" 
                    className="hover:text-emerald-600 transition-colors flex items-center gap-1"
                  >
                    <Home className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Link>
                  <ChevronRight className="h-3 w-3" />
                  <span className="text-foreground font-medium flex items-center gap-1">
                    <Smile className="h-3 w-3" />
                    Classmates
                  </span>
                </motion.nav>

                {/* Fun Page Header */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 sm:mb-8"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <GraduationCap className="h-7 w-7 sm:h-8 sm:w-8 text-emerald-600" />
                        My Classmates
                      </h1>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <p className="text-sm text-slate-500">
                          {userClass ? (
                            <>🎓 Students in <span className="font-semibold text-emerald-700">{userClass}</span></>
                          ) : (
                            <>👥 View and connect with your classmates</>
                          )}
                        </p>
                        {userClass && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 text-xs">
                            <span className="mr-1">{classFunFact.emoji}</span>
                            {classFunFact.fact}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => router.push('/student')}
                      className="w-full sm:w-auto h-9 text-sm shadow-sm hover:shadow-md transition-all border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 group"
                    >
                      <ArrowLeft className="mr-1.5 h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
                      Back to Dashboard
                    </Button>
                  </div>
                  
                  {/* Fun decorative banner */}
                  <div className="mt-4 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      <span>Connect with classmates, share notes, and grow together!</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="h-3 w-3 text-red-400" />
                      <Star className="h-3 w-3 text-amber-400" />
                      <Smile className="h-3 w-3 text-emerald-500" />
                    </div>
                  </div>
                </motion.div>

                {/* Classmates Roster - Fun version */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <StudentClassRoster 
                    studentClass={profile?.class || contextUser?.class}
                    studentId={contextUser?.id}
                    compact={false}
                    onClassmateClick={(classmate) => {
                      console.log('🎉 Clicked classmate:', classmate)
                    }}
                  />
                </motion.div>
                
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

// Add Badge import
import { Badge } from '@/components/ui/badge'