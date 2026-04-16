/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
// app/portal/page.tsx - FULLY FIXED FOR VERCEL
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
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
import { toast } from 'sonner'

interface SchoolSettings {
  logo_path: string
  school_name: string
  school_motto: string
}

export default function LoginPage() {
  const router = useRouter()
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
  })
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [loginSuccessData, setLoginSuccessData] = useState<{
    userName: string
    role: 'student' | 'teacher' | 'admin'
  } | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const hasRedirected = useRef(false)

  // Check if already logged in - NO AUTO REDIRECT (prevents loop)
  useEffect(() => {
    const checkSession = async () => {
      if (hasRedirected.current) {
        setIsCheckingAuth(false)
        return
      }
      
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        // Just log the session, don't redirect automatically
        if (session) {
          console.log('User already logged in, staying on portal page')
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, full_name')
            .eq('id', session.user.id)
            .maybeSingle()
          
          if (profile) {
            console.log(`Logged in as: ${profile.role} - user can click dashboard button`)
          }
        }
      } catch (err) {
        console.error('Auth check error:', err)
      } finally {
        setIsCheckingAuth(false)
      }
    }
    
    checkSession()
  }, [])

  // Load school settings
  useEffect(() => {
    async function loadSchoolSettings() {
      try {
        const { data } = await supabase
          .from('school_settings')
          .select('*')
          .maybeSingle()

        if (data) {
          setSchoolSettings({
            logo_path: data.logo_path || '',
            school_name: data.school_name || 'Vincollins College',
            school_motto: data.school_motto || 'Geared Towards Excellence',
          })
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
    setLoading(true)
    setError('')

    const cleanEmail = email.trim().toLowerCase().replace(/\s+/g, '')
    const cleanPassword = password.trim()

    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      })

      if (signInError) {
        console.error('Sign in error:', signInError)
        setError('Invalid email or password. Please try again.')
        setLoading(false)
        return
      }

      if (!signInData?.user) {
        setError('Login failed. Please try again.')
        setLoading(false)
        return
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', signInData.user.id)
        .maybeSingle()

      const userRole = profile?.role?.toLowerCase() || 'student'
      const userName = profile?.full_name || signInData.user.email?.split('@')[0] || 'User'
      
      const formattedName = userName.split(' ')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')

      const mappedRole = userRole === 'staff' ? 'teacher' : userRole
      
      // Check role matches selected tab
      if (mappedRole !== selectedRole) {
        const roleDisplayName = mappedRole === 'teacher' ? 'staff' : mappedRole
        setError(`This account is for ${roleDisplayName}. Please select the ${roleDisplayName} tab.`)
        await supabase.auth.signOut()
        setLoading(false)
        return
      }

      console.log('✅ Login successful')

      setLoginSuccessData({
        userName: formattedName,
        role: mappedRole as 'student' | 'teacher' | 'admin'
      })
      setShowSuccessModal(true)
      setLoading(false)

    } catch (err: any) {
      console.error('Login error:', err)
      setError('An unexpected error occurred. Please try again.')
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

  // Success Modal Component with Auto-Redirect
  const SuccessModal = () => {
    if (!loginSuccessData) return null
    
    const { userName, role } = loginSuccessData
    const roleConfig = {
      admin: {
        icon: '🛡️',
        color: '#9333EA',
        bgColor: '#F3E8FF',
        borderColor: '#D8B4FE',
        greeting: 'Welcome back, Administrator',
        redirectPath: '/admin',
      },
      teacher: {
        icon: '📚',
        color: '#2563EB',
        bgColor: '#EFF6FF',
        borderColor: '#BFDBFE',
        greeting: 'Welcome back, Teacher',
        redirectPath: '/staff',
      },
      student: {
        icon: '🎓',
        color: '#059669',
        bgColor: '#ECFDF5',
        borderColor: '#A7F3D0',
        greeting: 'Welcome back, Student',
        redirectPath: '/student',
      }
    }

    const config = roleConfig[role]
    const firstName = userName.split(' ')[0]

    // Auto-redirect after 2 seconds
    useEffect(() => {
      const timer = setTimeout(() => {
        window.location.replace(config.redirectPath)
      }, 2000)
      
      return () => clearTimeout(timer)
    }, [config.redirectPath])

    const goToDashboard = () => {
      setShowSuccessModal(false)
      window.location.replace(config.redirectPath)
    }

    return (
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowSuccessModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring" as const, damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div 
                className="absolute inset-0 opacity-5"
                style={{
                  background: `linear-gradient(135deg, ${config.color} 0%, ${config.color} 100%)`,
                }}
              />
              
              <div 
                className="absolute top-0 left-0 right-0 h-2"
                style={{ background: config.color }}
              />
              
              <div className="relative p-8">
                <div className="flex flex-col items-center text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring" as const, damping: 15, stiffness: 200, delay: 0.2 }}
                    className="mb-6"
                  >
                    <div 
                      className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
                      style={{ 
                        background: config.bgColor,
                        border: `3px solid ${config.borderColor}`,
                      }}
                    >
                      {config.icon}
                    </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <CheckCircle 
                        className="h-6 w-6" 
                        style={{ color: config.color }} 
                      />
                      <h3 className="text-2xl font-bold text-gray-900">
                        Login Successful!
                      </h3>
                    </div>
                    
                    <p className="text-gray-600 mb-2">
                      <span className="font-semibold" style={{ color: config.color }}>
                        {config.greeting}
                      </span>
                    </p>
                    
                    <p className="text-xl font-bold text-gray-800 mb-4">
                      {firstName}! 👋
                    </p>
                    
                    <p className="text-gray-500 mb-6">
                      Redirecting to your dashboard...
                    </p>
                    
                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mb-4">
                      <motion.div
                        className="h-1.5 rounded-full"
                        style={{ background: config.color }}
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 2, ease: "linear" }}
                      />
                    </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex gap-3 w-full"
                  >
                    <Button
                      onClick={goToDashboard}
                      className="flex-1"
                      style={{ background: config.color }}
                    >
                      Go to Dashboard Now
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </motion.div>
                </div>
              </div>
              
              <div className="absolute top-4 right-4">
                <Sparkles className="h-5 w-5 text-yellow-400 animate-pulse" />
              </div>
              <div className="absolute bottom-4 left-4">
                <Sparkles className="h-4 w-4 text-yellow-400 animate-pulse" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        
        <div className="flex-1 flex items-stretch pt-16">
          <div className="flex w-full">
            {/* LEFT SIDE - HERO IMAGE */}
            <div className="hidden lg:block lg:w-[55%] relative">
              <div className="absolute inset-0">
                <Image
                  src="/images/portal.jpg"
                  alt="Vincollins College Campus"
                  fill
                  className="object-cover object-center"
                  priority
                  sizes="55vw"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.classList.add('bg-gradient-to-br', 'from-[#0A2472]', 'via-[#1e3a8a]', 'to-[#0A2472]');
                    }
                  }}
                />
              </div>
              
              <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              
              <div className="absolute inset-0 flex flex-col justify-center px-8 lg:px-12 py-12">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-white max-w-xl mx-auto text-center"
                >
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6">
                    <Sparkles className="h-4 w-4 text-yellow-300" />
                    <span className="text-sm font-medium">Secure Portal Access</span>
                  </div>

                  <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 leading-tight">
                    Welcome to Your Digital Campus
                  </h1>
                  
                  <p className="text-lg lg:text-xl text-white/90 font-light mb-6">
                    Experience education management redefined for excellence
                  </p>
                  
                  <div className="inline-block px-5 py-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                    <p className="text-white text-base lg:text-lg font-semibold">
                      {schoolSettings.school_name}
                    </p>
                    <p className="text-white/70 text-xs lg:text-sm italic">
                      "{schoolSettings.school_motto}"
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* RIGHT SIDE - LOGIN FORM */}
            <div className="w-full lg:w-[45%] bg-white flex items-center py-8 lg:py-12">
              <div className="w-full max-w-md mx-auto px-6 sm:px-8 lg:px-10">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-center mb-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring" as const, stiffness: 200, damping: 20 }}
                    >
                      {schoolSettings?.logo_path ? (
                        <div className="relative h-20 w-20 mx-auto mb-3">
                          <Image src={schoolSettings.logo_path} alt="Logo" fill className="object-contain" />
                        </div>
                      ) : (
                        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-[#0A2472] to-[#1e3a8a] flex items-center justify-center mx-auto mb-3 shadow-xl">
                          <GraduationCap className="h-10 w-10 text-white" />
                        </div>
                      )}
                    </motion.div>
                    <h2 className="text-xl lg:hidden font-bold text-gray-900">
                      {schoolSettings?.school_name || 'Vincollins College'}
                    </h2>
                  </div>

                  <div className="text-center mb-6">
                    <h3 className="text-2xl lg:text-3xl font-bold text-gray-900">Sign In</h3>
                    <p className="text-gray-500 text-sm mt-1">Access your personalized portal</p>
                  </div>

                  <Tabs value={selectedRole} onValueChange={(v) => handleRoleChange(v as any)} className="mb-5">
                    <TabsList className="grid w-full grid-cols-3 gap-1.5 bg-gray-100 p-1 rounded-xl">
                      <TabsTrigger value="student" className="flex items-center justify-center gap-1.5 rounded-lg py-2.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                        <GraduationCap className="h-4 w-4" />
                        <span className="font-medium text-sm">Student</span>
                      </TabsTrigger>
                      <TabsTrigger value="teacher" className="flex items-center justify-center gap-1.5 rounded-lg py-2.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                        <Users className="h-4 w-4" />
                        <span className="font-medium text-sm">Teacher</span>
                      </TabsTrigger>
                      <TabsTrigger value="admin" className="flex items-center justify-center gap-1.5 rounded-lg py-2.5 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                        <Shield className="h-4 w-4" />
                        <span className="font-medium text-sm">Admin</span>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <motion.div 
                    key={selectedRole}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mb-5 rounded-xl p-3 text-center border ${
                      selectedRole === 'admin' ? 'bg-purple-50 border-purple-200 text-purple-700' :
                      selectedRole === 'teacher' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                      'bg-emerald-50 border-emerald-200 text-emerald-700'
                    }`}
                  >
                    <p className="text-sm">
                      {selectedRole === 'admin' && 'Administrative dashboard with full system control'}
                      {selectedRole === 'teacher' && 'Teaching portal for class and exam management'}
                      {selectedRole === 'student' && 'Student dashboard with CBT exam access'}
                    </p>
                  </motion.div>

                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                        <Alert variant="destructive" className="mb-5 border-red-200 bg-red-50 text-red-800">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-sm">{error}</AlertDescription>
                        </Alert>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          type="email"
                          placeholder="your.email@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 h-11 rounded-lg border-gray-200 bg-gray-50 focus:bg-white text-sm"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-10 h-11 rounded-lg border-gray-200 bg-gray-50 focus:bg-white text-sm"
                          required
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className={`w-full h-11 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all rounded-lg mt-2 ${getRoleColor()}`}
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

                  <div className="mt-6 pt-5 border-t border-gray-100">
                    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3" />
                        <span>08023013110</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MailIcon className="h-3 w-3" />
                        <span>vincollinscollege@gmail.com</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-center text-xs text-gray-400 mt-4">
                    Need assistance?{' '}
                    <Link href="/contact" className="text-primary hover:underline font-medium">
                      Contact Support
                    </Link>
                  </p>
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