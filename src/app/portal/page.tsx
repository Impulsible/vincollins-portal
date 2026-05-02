/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
// app/portal/page.tsx - WITH CORRECT SCHOOL LOGO (NO WHITE FILTER)
'use client'

import { useState, useEffect, useRef } from 'react'
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
  Phone, Mail as MailIcon, CheckCircle, BookOpen, School
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

interface SchoolSettings {
  logo_path: string
  school_name: string
  school_motto: string
  school_phone?: string
  school_email?: string
}

export default function LoginPage() {
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
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
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  
  const loginInProgress = useRef(false)
  const hasRedirected = useRef(false)
  const authCheckDone = useRef(false)

  // Check if already authenticated - redirect to dashboard
  useEffect(() => {
    if (authCheckDone.current) return
    
    const checkAuth = async () => {
      // Don't redirect while login is in progress
      if (loginInProgress.current) {
        setIsCheckingAuth(false)
        return
      }

      // If user context already has a user, redirect
      if (user && !hasRedirected.current) {
        const redirectMap: Record<string, string> = {
          admin: '/admin',
          teacher: '/staff',
          student: '/student',
        }
        
        hasRedirected.current = true
        router.replace(redirectMap[user.role] || '/student')
        return
      }

      // If user context is still loading, wait
      if (userLoading) {
        return
      }

      // If no user in context, check session directly (only once)
      if (!user && !authCheckDone.current) {
        authCheckDone.current = true
        
        try {
          const { data: { session } } = await supabase.auth.getSession()
          
          if (session && !hasRedirected.current) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', session.user.id)
              .maybeSingle()
            
            const role = profile?.role === 'staff' ? 'teacher' : (profile?.role || 'student')
            
            const redirectMap: Record<string, string> = {
              admin: '/admin',
              teacher: '/staff',
              student: '/student',
            }
            
            hasRedirected.current = true
            router.replace(redirectMap[role] || '/student')
            return
          }
        } catch (error) {
          console.error('Auth check error:', error)
        }
      }
      
      setIsCheckingAuth(false)
    }

    checkAuth()
  }, [user, userLoading, router])

  // Load school settings
  useEffect(() => {
    async function loadSchoolSettings() {
      try {
        const { data } = await supabase
          .from('school_settings')
          .select('*')
          .maybeSingle()

        if (data) {
          setSchoolSettings(prev => ({
            ...prev,
            logo_path: data.logo_path || '',
            school_name: data.school_name || 'Vincollins College',
            school_motto: data.school_motto || 'Geared Towards Excellence',
            school_phone: data.school_phone || '+234 912 1155 554',
            school_email: data.school_email || 'vincollinscollege@gmail.com',
          }))
        }
      } catch (err) {
        console.error('Failed to load school settings:', err)
      }
    }
    loadSchoolSettings()
  }, [])

  // Login handler
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    
    // Prevent double submission
    if (loginInProgress.current) {
      console.log('Login already in progress')
      return
    }
    
    loginInProgress.current = true
    setLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      const cleanEmail = email.trim().toLowerCase().replace(/\s+/g, '')
      const cleanPassword = password.trim()

      // Validate inputs
      if (!cleanEmail || !cleanPassword) {
        setError('Please enter both email and password.')
        return
      }

      // Sign in with Supabase
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      })

      if (signInError) {
        console.error('Sign in error:', signInError.message)
        
        // User-friendly error messages
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please try again.')
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('Please confirm your email address before logging in.')
        } else if (signInError.message.includes('rate_limit')) {
          setError('Too many attempts. Please try again in a few minutes.')
        } else {
          setError('Login failed. Please check your credentials and try again.')
        }
        return
      }

      if (!signInData?.user) {
        setError('Login failed. No user data received. Please try again.')
        return
      }

      // Small delay to ensure session is properly established
      await new Promise(resolve => setTimeout(resolve, 800))

      // Get user profile directly from database
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, full_name, first_name, last_name')
        .eq('id', signInData.user.id)
        .maybeSingle()

      if (profileError) {
        console.error('Profile fetch error:', profileError)
      }

      // Determine user role
      const userRole = profile?.role?.toLowerCase() || 
                       signInData.user.user_metadata?.role?.toLowerCase() || 
                       'student'
      const mappedRole = userRole === 'staff' ? 'teacher' : (userRole as 'student' | 'teacher' | 'admin')
      
      // Check if role matches selected tab
      if (mappedRole !== selectedRole) {
        const roleDisplayName = mappedRole === 'teacher' ? 'Teacher/Staff' : 
                                 mappedRole.charAt(0).toUpperCase() + mappedRole.slice(1)
        setError(`This account is registered as ${roleDisplayName}. Please select the correct tab above.`)
        await supabase.auth.signOut()
        return
      }

      // Format user name
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

      // Determine redirect path
      const redirectMap: Record<string, string> = {
        admin: '/admin',
        teacher: '/staff',
        student: '/student',
      }
      
      const redirectPath = redirectMap[mappedRole] || '/student'

      // Reset auth check flag so we don't interfere with redirect
      authCheckDone.current = true
      
      // Show success modal
      setLoginSuccessData({
        userName: formattedName,
        role: mappedRole as 'student' | 'teacher' | 'admin',
        redirectPath: redirectPath
      })
      setShowSuccessModal(true)
      setSuccessMessage('Login successful! Redirecting...')

    } catch (err: any) {
      console.error('Unexpected login error:', err)
      setError('An unexpected error occurred. Please try again later.')
    } finally {
      setLoading(false)
      loginInProgress.current = false
    }
  }

  const handleRoleChange = (role: 'student' | 'teacher' | 'admin') => {
    setSelectedRole(role)
    setError('')
    setSuccessMessage('')
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

  const getRoleRingColor = () => {
    switch (selectedRole) {
      case 'admin': return 'ring-purple-500'
      case 'teacher': return 'ring-blue-500'
      default: return 'ring-emerald-500'
    }
  }

  // Success Modal Component
  const SuccessModal = () => {
    if (!loginSuccessData) return null
    
    const { userName, role, redirectPath } = loginSuccessData
    
    const roleConfig = {
      admin: {
        icon: '🛡️',
        emoji: '👑',
        color: '#9333EA',
        bgColor: '#F3E8FF',
        borderColor: '#D8B4FE',
        lightBg: 'from-purple-50 to-fuchsia-50',
        greeting: 'Welcome back, Administrator',
        message: 'Accessing admin control panel...',
      },
      teacher: {
        icon: '📚',
        emoji: '👋',
        color: '#2563EB',
        bgColor: '#EFF6FF',
        borderColor: '#BFDBFE',
        lightBg: 'from-blue-50 to-cyan-50',
        greeting: 'Welcome back, Teacher',
        message: 'Loading your teaching dashboard...',
      },
      student: {
        icon: '🎓',
        emoji: '🌟',
        color: '#059669',
        bgColor: '#ECFDF5',
        borderColor: '#A7F3D0',
        lightBg: 'from-emerald-50 to-teal-50',
        greeting: 'Welcome back, Student',
        message: 'Preparing your learning space...',
      }
    }

    const config = roleConfig[role]
    const firstName = userName.split(' ')[0]

    const goToDashboard = () => {
      setShowSuccessModal(false)
      hasRedirected.current = true
      router.push(redirectPath)
    }

    return (
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowSuccessModal(false)
              goToDashboard()
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top gradient bar */}
              <div 
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ background: `linear-gradient(90deg, ${config.color}, ${config.color}88)` }}
              />
              
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
                <div className="absolute inset-0" style={{ 
                  backgroundImage: 'radial-gradient(circle at 25px 25px, #333 2%, transparent 0%), radial-gradient(circle at 75px 75px, #333 2%, transparent 0%)',
                  backgroundSize: '100px 100px'
                }} />
              </div>

              <div className="relative p-8">
                {/* Close button */}
                <button
                  onClick={() => {
                    setShowSuccessModal(false)
                    goToDashboard()
                  }}
                  className="absolute top-4 right-4 h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <div className="flex flex-col items-center text-center">
                  {/* Success icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.1 }}
                    className="mb-6"
                  >
                    <div 
                      className="relative"
                    >
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
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                        className="absolute -bottom-1 -right-1 h-8 w-8 bg-green-500 rounded-full flex items-center justify-center z-20 shadow-lg"
                      >
                        <CheckCircle className="h-5 w-5 text-white" />
                      </motion.div>
                    </div>
                  </motion.div>
                  
                  {/* Welcome text */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-3"
                  >
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
                  </motion.div>
                  
                  {/* Action buttons */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-col gap-3 w-full mt-8"
                  >
                    <Button
                      onClick={goToDashboard}
                      className="w-full py-6 text-base font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                      style={{ 
                        background: `linear-gradient(135deg, ${config.color}, ${config.color}dd)`,
                      }}
                    >
                      <span>Go to Dashboard</span>
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                    
                    <button
                      onClick={() => setShowSuccessModal(false)}
                      className="text-sm text-gray-400 hover:text-gray-600 transition-colors py-2"
                    >
                      Stay on this page
                    </button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  // Loading state
  if (isCheckingAuth || userLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="h-10 w-10 text-primary" />
        </motion.div>
        <p className="mt-4 text-sm text-gray-500">Checking authentication...</p>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        
        <div className="flex-1 flex items-stretch pt-16 sm:pt-20">
          <div className="flex w-full">
            {/* LEFT SIDE - CLEAN IMAGE WITH MINIMAL TEXT (NO BLUE OVERLAY, CORRECT LOGO COLORS) */}
            <div className="hidden lg:flex lg:w-[55%] xl:w-[60%] relative overflow-hidden">
              {/* Background Image - NO BLUE OVERLAY */}
              <Image
                src="/images/portal.jpg"
                alt="Vincollins College Campus"
                fill
                className="object-cover object-center"
                priority
                sizes="60vw"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />

              {/* Subtle dark gradient for text readability only - NO BLUE */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />

              {/* Decorative elements - subtle */}
              <div className="absolute top-20 left-10 w-64 h-64 bg-[#F5A623]/5 rounded-full blur-3xl" />
              <div className="absolute bottom-20 right-10 w-80 h-80 bg-white/5 rounded-full blur-3xl" />

              {/* Content - ONLY badge, school name, and welcome heading */}
              <div className="relative flex flex-col justify-center px-12 xl:px-16 py-12 w-full">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="text-white"
                >
                  {/* Secure Portal Access Badge */}
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 mb-8">
                    <Sparkles className="h-4 w-4 text-yellow-300" />
                    <span className="text-sm font-medium tracking-wide">Secure Portal Access</span>
                  </div>

                  {/* Logo and School Name - WITH CORRECT LOGO COLORS (NO WHITE FILTER) */}
                  <div className="flex items-center gap-4 mb-8">
                    {schoolSettings?.logo_path ? (
                      <div className="relative h-16 w-16 xl:h-20 xl:w-20">
                        <Image 
                          src={schoolSettings.logo_path} 
                          alt="Logo" 
                          fill 
                          sizes="80px"
                          className="object-contain"
                          priority
                        />
                      </div>
                    ) : (
                      <div className="h-16 w-16 xl:h-20 xl:w-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
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

                  {/* Welcome Heading - NO extra text, NO features list */}
                  <h1 className="text-4xl xl:text-5xl 2xl:text-6xl font-bold leading-tight">
                    Welcome to Your{' '}
                    <span className="text-[#F5A623]">Digital Campus</span>
                  </h1>
                </motion.div>
              </div>
            </div>

            {/* RIGHT SIDE - LOGIN FORM (COMPLETELY UNCHANGED) */}
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
                          />
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

                  {/* Success Message */}
                  <AnimatePresence>
                    {successMessage && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <Alert className="mb-6 border-green-200 bg-green-50 text-green-800 rounded-xl">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-sm ml-2">{successMessage}</AlertDescription>
                        </Alert>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Login Form */}
                  <form onSubmit={handleLogin} className="space-y-5">
                    {/* Email Field */}
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

                    {/* Password Field */}
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

                    {/* Submit Button */}
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
      
      {/* Success Modal */}
      <SuccessModal />
    </>
  )
}