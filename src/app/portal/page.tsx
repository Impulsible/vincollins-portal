/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
// app/portal/page.tsx - COMPLETE FIXED VERSION (No image height warning)
'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/contexts/UserContext'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Mail, Eye, EyeOff, GraduationCap, Shield, Users,
  Loader2, AlertCircle, KeyRound, ArrowRight, Sparkles,
  Phone, Mail as MailIcon, CheckCircle
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SchoolSettings {
  logo_path: string
  school_name: string
  school_motto: string
  school_phone?: string
  school_email?: string
}

// Preload critical images for faster loading
const preloadImages = [
  '/images/portal.jpg',
]

export default function LoginPage() {
  const router = useRouter()
  const { user, loading: userLoading, refreshUser, isAuthenticated } = useUser()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher' | 'admin'>('student')
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>({
    logo_path: '',
    school_name: 'Vincollins College',
    school_motto: 'Geared Towards Excellence',
    school_phone: '+234 912 1155 554',
    school_email: 'vincollinscollege@gmail.com',
  })
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [loginSuccessData, setLoginSuccessData] = useState<{
    userName: string
    role: 'student' | 'teacher' | 'admin'
    redirectPath: string
  } | null>(null)
  
  const loginInProgress = useRef(false)
  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null)
  const redirectStartedRef = useRef(false)
  const [imageError, setImageError] = useState(false)
  const [logoLoaded, setLogoLoaded] = useState(false)
  const [heroImageLoaded, setHeroImageLoaded] = useState(false)

  // Preload images on mount
  useEffect(() => {
    preloadImages.forEach((src) => {
      const img = document.createElement('img')
      img.src = src
    })
  }, [])

  // Cache prevention - Clear stale data on portal load
  useEffect(() => {
    const clearStaleCache = () => {
      const keysToKeep = ['user_profile', 'auth_user', 'auth_role']
      const now = Date.now()
      const lastClear = localStorage.getItem('portalCacheClear')
      
      if (!lastClear || now - parseInt(lastClear) > 24 * 60 * 60 * 1000) {
        Object.keys(localStorage).forEach(key => {
          if (!keysToKeep.includes(key) && !key.startsWith('sb-')) {
            localStorage.removeItem(key)
          }
        })
        localStorage.setItem('portalCacheClear', now.toString())
      }
    }
    
    clearStaleCache()
    
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        console.log('Page restored from bfcache - reloading...')
        window.location.reload()
      }
    }
    
    window.addEventListener('pageshow', handlePageShow)
    
    return () => {
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [])

  // Load school settings
  useEffect(() => {
    async function loadSchoolSettings() {
      try {
        const cachedSettings = localStorage.getItem('school_settings')
        if (cachedSettings) {
          try {
            const parsed = JSON.parse(cachedSettings)
            setSchoolSettings(prev => ({
              ...prev,
              ...parsed
            }))
          } catch (e) {
            // Invalid cache
          }
        }
        
        const { data } = await supabase
          .from('school_settings')
          .select('*')
          .maybeSingle()

        if (data) {
          const newSettings = {
            logo_path: data.logo_path || '',
            school_name: data.school_name || 'Vincollins College',
            school_motto: data.school_motto || 'Geared Towards Excellence',
            school_phone: data.school_phone || '+234 912 1155 554',
            school_email: data.school_email || 'vincollinscollege@gmail.com',
          }
          setSchoolSettings(newSettings)
          localStorage.setItem('school_settings', JSON.stringify(newSettings))
        }
      } catch (err) {
        console.error('Failed to load school settings:', err)
      }
    }
    loadSchoolSettings()
  }, [])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current)
      }
    }
  }, [])

  // Auto-redirect after 3 seconds when modal is showing
  useEffect(() => {
    if (showSuccessModal && loginSuccessData && !redirectStartedRef.current) {
      console.log('Starting 3-second redirect timer to:', loginSuccessData.redirectPath)
      redirectStartedRef.current = true
      
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current)
      }
      
      redirectTimerRef.current = setTimeout(() => {
        console.log('Redirecting to dashboard:', loginSuccessData.redirectPath)
        router.push(loginSuccessData.redirectPath)
      }, 3000)
      
      return () => {
        if (redirectTimerRef.current) {
          clearTimeout(redirectTimerRef.current)
        }
      }
    }
  }, [showSuccessModal, loginSuccessData, router])

  // Login handler
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    
    if (loginInProgress.current || loading) {
      return
    }
    
    loginInProgress.current = true
    setLoading(true)
    setError('')
    redirectStartedRef.current = false

    try {
      const cleanEmail = email.trim().toLowerCase()
      const cleanPassword = password.trim()

      if (!cleanEmail || !cleanPassword) {
        setError('Please enter both email and password.')
        loginInProgress.current = false
        setLoading(false)
        return
      }

      console.log('Attempting login for:', cleanEmail)

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      })

      if (signInError) {
        console.error('Sign in error:', signInError)
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please try again.')
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('Please confirm your email address before logging in.')
        } else if (signInError.message.includes('rate_limit')) {
          setError('Too many attempts. Please try again in a few minutes.')
        } else {
          setError('Login failed. Please check your credentials and try again.')
        }
        loginInProgress.current = false
        setLoading(false)
        return
      }

      if (!signInData?.user) {
        setError('Login failed. No user data received.')
        loginInProgress.current = false
        setLoading(false)
        return
      }

      console.log('Login successful, fetching profile')

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name, first_name, last_name')
        .eq('id', signInData.user.id)
        .maybeSingle()

      const userRole = profile?.role?.toLowerCase() || 
                       signInData.user.user_metadata?.role?.toLowerCase() || 
                       'student'
      const mappedRole = userRole === 'staff' ? 'teacher' : (userRole as 'student' | 'teacher' | 'admin')
      
      if (mappedRole !== selectedRole) {
        const roleDisplayName = mappedRole === 'teacher' ? 'Teacher/Staff' : 
                                 mappedRole.charAt(0).toUpperCase() + mappedRole.slice(1)
        setError(`This account is registered as ${roleDisplayName}. Please select the correct tab above.`)
        await supabase.auth.signOut()
        loginInProgress.current = false
        setLoading(false)
        return
      }

      let userName = 'User'
      if (profile?.first_name && profile?.last_name) {
        userName = `${profile.first_name} ${profile.last_name}`
      } else if (profile?.full_name) {
        userName = profile.full_name
      } else if (signInData.user.user_metadata?.full_name) {
        userName = signInData.user.user_metadata.full_name
      } else if (signInData.user.email) {
        userName = signInData.user.email.split('@')[0]
      }

      const formattedName = userName
        .split(/[.\s_-]+/)
        .filter(word => word.length > 0)
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')

      const redirectMap: Record<string, string> = {
        admin: '/admin',
        teacher: '/staff',
        student: '/student',
      }
      
      const redirectPath = redirectMap[mappedRole] || '/student'

      const userData = {
        id: signInData.user.id,
        full_name: formattedName,
        first_name: formattedName.split(' ')[0],
        email: cleanEmail,
        role: mappedRole,
        timestamp: Date.now()
      }
      localStorage.setItem('auth_user', JSON.stringify({ id: signInData.user.id, role: mappedRole }))
      localStorage.setItem('auth_role', mappedRole)
      localStorage.setItem('user_profile', JSON.stringify(userData))

      console.log('Setting modal data:', { userName: formattedName, role: mappedRole, redirectPath })
      
      setLoginSuccessData({
        userName: formattedName,
        role: mappedRole as 'student' | 'teacher' | 'admin',
        redirectPath: redirectPath
      })
      setShowSuccessModal(true)
      setLoading(false)
      
      await refreshUser()
      
      setTimeout(() => {
        loginInProgress.current = false
      }, 500)

    } catch (err: any) {
      console.error('Login error:', err)
      setError('An unexpected error occurred. Please try again later.')
      loginInProgress.current = false
      setLoading(false)
    }
  }

  const handleRoleChange = (role: 'student' | 'teacher' | 'admin') => {
    setSelectedRole(role)
    setError('')
  }

  const getRoleColor = () => {
    switch (selectedRole) {
      case 'admin': return 'bg-purple-600 hover:bg-purple-700'
      case 'teacher': return 'bg-blue-600 hover:bg-blue-700'
      default: return 'bg-emerald-600 hover:bg-emerald-700'
    }
  }

  const getRoleIcon = () => {
    switch (selectedRole) {
      case 'admin': return <Shield className="h-4 w-4" />
      case 'teacher': return <Users className="h-4 w-4" />
      default: return <GraduationCap className="h-4 w-4" />
    }
  }

  // Success Modal Component
  const SuccessModal = () => {
    if (!showSuccessModal || !loginSuccessData) {
      return null
    }
    
    const { userName, role, redirectPath } = loginSuccessData
    
    const roleConfig = {
      admin: {
        icon: '🛡️',
        emoji: '👑',
        color: '#9333EA',
        bgColor: '#F3E8FF',
        borderColor: '#D8B4FE',
        greeting: 'Welcome back, Administrator',
        message: 'Accessing admin control panel...',
      },
      teacher: {
        icon: '📚',
        emoji: '👋',
        color: '#2563EB',
        bgColor: '#EFF6FF',
        borderColor: '#BFDBFE',
        greeting: 'Welcome back, Teacher',
        message: 'Loading your teaching dashboard...',
      },
      student: {
        icon: '🎓',
        emoji: '🌟',
        color: '#059669',
        bgColor: '#ECFDF5',
        borderColor: '#A7F3D0',
        greeting: 'Welcome back, Student',
        message: 'Preparing your learning space...',
      }
    }

    const config = roleConfig[role]
    const firstName = userName.split(' ')[0]

    const goToDashboard = () => {
      console.log('Manual redirect to dashboard')
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current)
        redirectTimerRef.current = null
      }
      setShowSuccessModal(false)
      setLoginSuccessData(null)
      setLoading(false)
      loginInProgress.current = false
      redirectStartedRef.current = false
      router.push(redirectPath)
    }

    return (
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div 
            className="absolute top-0 left-0 right-0 h-1.5"
            style={{ background: `linear-gradient(90deg, ${config.color}, ${config.color}88)` }}
          />
          
          <div className="relative p-8">
            <button
              onClick={goToDashboard}
              className="absolute top-4 right-4 h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="mb-6">
                <div className="relative">
                  <div 
                    className="w-28 h-28 rounded-full flex items-center justify-center text-6xl relative z-10"
                    style={{ 
                      background: `linear-gradient(135deg, ${config.bgColor}, white)`,
                      border: `3px solid ${config.borderColor}`,
                      boxShadow: `0 0 40px ${config.color}20`
                    }}
                  >
                    {config.icon}
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-8 w-8 bg-green-500 rounded-full flex items-center justify-center z-20 shadow-lg">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-3xl font-bold text-gray-900">
                  Welcome! {config.emoji}
                </h3>
                
                <p className="text-xl font-semibold" style={{ color: config.color }}>
                  {firstName}
                </p>
                
                <p className="text-gray-500">
                  {config.greeting}
                </p>
                
                <p className="text-sm text-gray-400">
                  {config.message}
                </p>
              </div>
              
              <div className="flex flex-col gap-3 w-full mt-8">
                <Button
                  onClick={goToDashboard}
                  className="w-full py-6 text-base font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                  style={{ 
                    background: `linear-gradient(135deg, ${config.color}, ${config.color}dd)`,
                  }}
                >
                  <span>Go to Dashboard Now</span>
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                
                <p className="text-xs text-gray-400">
                  Redirecting in 3 seconds...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render portal page
  return (
    <>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        
        <div className="flex-1 flex items-stretch pt-16 sm:pt-20">
          <div className="flex w-full">
            {/* LEFT SIDE - IMAGE with explicit height container */}
            <div className="hidden lg:flex lg:w-[55%] xl:w-[60%]">
              <div className="relative w-full h-screen">
                {!imageError && (
                  <>
                    {!heroImageLoaded && (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#0A2472] to-[#1e3a8a] animate-pulse z-0" />
                    )}
                    <Image
                      src="/images/portal.jpg"
                      alt="Vincollins College Campus"
                      fill
                      className={cn(
                        "object-cover object-center transition-opacity duration-500 z-0",
                        heroImageLoaded ? "opacity-100" : "opacity-0"
                      )}
                      priority
                      sizes="(max-width: 1024px) 55vw, 60vw"
                      onLoad={() => setHeroImageLoaded(true)}
                      onError={() => setImageError(true)}
                    />
                  </>
                )}
                {imageError && (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0A2472] to-[#1e3a8a] z-0" />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent z-10" />
                <div className="relative z-20 flex flex-col justify-center px-12 xl:px-16 py-12 w-full h-full">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="text-white"
                  >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 mb-8">
                      <Sparkles className="h-4 w-4 text-yellow-300" />
                      <span className="text-sm font-medium tracking-wide">Secure Portal Access</span>
                    </div>

                    <div className="flex items-center gap-4 mb-8">
                      {schoolSettings?.logo_path ? (
                        <div className="relative h-16 w-16 xl:h-20 xl:w-20 shrink-0">
                          <Image 
                            src={schoolSettings.logo_path} 
                            alt="Logo" 
                            fill 
                            sizes="80px"
                            className={cn(
                              "object-contain transition-opacity duration-300",
                              logoLoaded ? "opacity-100" : "opacity-0"
                            )}
                            priority
                            onLoad={() => setLogoLoaded(true)}
                            onError={() => setLogoLoaded(true)}
                          />
                          {!logoLoaded && (
                            <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
                          )}
                        </div>
                      ) : (
                        <div className="h-16 w-16 xl:h-20 xl:w-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                          <GraduationCap className="h-8 w-8 xl:h-10 xl:w-10 text-white" />
                        </div>
                      )}
                      <div>
                        <h2 className="text-2xl xl:text-3xl font-bold">
                          {schoolSettings.school_name}
                        </h2>
                        <p className="text-white/60 text-sm italic mt-1">
                          &ldquo;{schoolSettings.school_motto}&rdquo;
                        </p>
                      </div>
                    </div>

                    <h1 className="text-4xl xl:text-5xl 2xl:text-6xl font-bold leading-tight">
                      Welcome to Your{' '}
                      <span className="text-[#F5A623]">Digital Campus</span>
                    </h1>
                  </motion.div>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE - LOGIN FORM */}
            <div className="w-full lg:w-[45%] xl:w-[40%] bg-white flex items-center justify-center py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
              <div className="w-full max-w-md">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  {/* Mobile Logo */}
                  <div className="lg:hidden text-center mb-8">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    >
                      {schoolSettings?.logo_path ? (
                        <div className="relative h-20 w-20 mx-auto mb-3">
                          <Image 
                            src={schoolSettings.logo_path} 
                            alt="Logo" 
                            fill 
                            sizes="80px"
                            className="object-contain"
                            priority
                            onLoad={() => setLogoLoaded(true)}
                            onError={() => setLogoLoaded(true)}
                          />
                          {!logoLoaded && (
                            <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
                          )}
                        </div>
                      ) : (
                        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-[#0A2472] to-[#1e3a8a] flex items-center justify-center mx-auto mb-3 shadow-xl">
                          <GraduationCap className="h-10 w-10 text-white" />
                        </div>
                      )}
                    </motion.div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {schoolSettings.school_name}
                    </h2>
                    <p className="text-xs text-gray-500 italic mt-1">
                      &ldquo;{schoolSettings.school_motto}&rdquo;
                    </p>
                  </div>

                  {/* Form Header */}
                  <div className="text-center mb-8">
                    <h3 className="text-2xl lg:text-3xl font-bold text-gray-900">
                      Sign In
                    </h3>
                    <p className="text-gray-500 text-sm mt-2">
                      Access your personalized portal
                    </p>
                  </div>

                  {/* Role Selection Tabs */}
                  <Tabs 
                    value={selectedRole} 
                    onValueChange={(v) => handleRoleChange(v as any)} 
                    className="mb-6"
                  >
                    <TabsList className="grid w-full grid-cols-3 gap-1 bg-gray-100 p-1 rounded-xl">
                      <TabsTrigger 
                        value="student" 
                        className="flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
                      >
                        <GraduationCap className="h-4 w-4" />
                        <span className="font-medium">Student</span>
                      </TabsTrigger>
                      <TabsTrigger 
                        value="teacher" 
                        className="flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
                      >
                        <Users className="h-4 w-4" />
                        <span className="font-medium">Teacher</span>
                      </TabsTrigger>
                      <TabsTrigger 
                        value="admin" 
                        className="flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
                      >
                        <Shield className="h-4 w-4" />
                        <span className="font-medium">Admin</span>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  {/* Role Info Banner */}
                  <motion.div 
                    key={selectedRole}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`mb-6 rounded-xl p-4 text-center border ${
                      selectedRole === 'admin' 
                        ? 'bg-purple-50 border-purple-200 text-purple-700' 
                        : selectedRole === 'teacher' 
                          ? 'bg-blue-50 border-blue-200 text-blue-700' 
                          : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    }`}
                  >
                    <p className="text-sm font-medium">
                      {selectedRole === 'admin' && '🛡️ Administrative dashboard with full system control'}
                      {selectedRole === 'teacher' && '📚 Teaching portal for class and exam management'}
                      {selectedRole === 'student' && '🎓 Student dashboard with CBT exam access'}
                    </p>
                  </motion.div>

                  {/* Error Message */}
                  <AnimatePresence>
                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50 text-red-800 rounded-xl">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-sm ml-2">{error}</AlertDescription>
                        </Alert>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Login Form */}
                  <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          type="email"
                          placeholder="your.email@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={`pl-10 h-12 rounded-xl border-2 bg-gray-50 focus:bg-white text-sm transition-all ${
                            error ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-primary'
                          }`}
                          required
                          disabled={loading}
                          autoComplete="email"
                          autoFocus
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className={`pl-10 pr-12 h-12 rounded-xl border-2 bg-gray-50 focus:bg-white text-sm transition-all ${
                            error ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-primary'
                          }`}
                          required
                          disabled={loading}
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className={`w-full h-12 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all rounded-xl mt-2 ${getRoleColor()}`}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Authenticating...
                        </>
                      ) : (
                        <>
                          {getRoleIcon()}
                          <span className="ml-2">Sign In to Portal</span>
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>

                  {/* Footer Info */}
                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{schoolSettings.school_phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MailIcon className="h-3.5 w-3.5" />
                        <span>{schoolSettings.school_email}</span>
                      </div>
                    </div>

                    <p className="text-center text-xs text-gray-400 mt-4">
                      Need assistance?{' '}
                      <Link 
                        href="/contact" 
                        className="text-primary hover:underline font-medium transition-colors"
                      >
                        Contact Support
                      </Link>
                    </p>

                    <p className="text-center text-[11px] text-gray-300 mt-6">
                      © {new Date().getFullYear()} {schoolSettings.school_name}. All rights reserved.
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <SuccessModal />
    </>
  )
}