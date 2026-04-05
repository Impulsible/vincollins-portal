/* eslint-disable react-hooks/exhaustive-deps */
 
/* eslint-disable @typescript-eslint/no-unused-vars */
 
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Mail,
  Eye,
  EyeOff,
  GraduationCap,
  Shield,
  Users,
  Loader2,
  AlertCircle,
  Phone,
  Mail as MailIcon,
  MapPin,
  KeyRound,
  CheckCircle2,
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
  const [email, setEmail] = useState('vincollinscollege@gmail.com')
  const [password, setPassword] = useState('VIN-ADM-4827')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedRole, setSelectedRole] = useState<'student' | 'staff' | 'admin'>('admin')
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>({
    logo_path: '',
    school_name: 'Vincollins College',
    school_motto: 'Geared Towards Success',
  })

  useEffect(() => {
    loadSchoolSettings()
    checkExistingSession()
  }, [])

  async function loadSchoolSettings() {
    try {
      const { data, error } = await supabase
        .from('school_settings')
        .select('*')
        .maybeSingle()

      if (!error && data) {
        setSchoolSettings({
          logo_path: data.logo_path || '',
          school_name: data.school_name || 'Vincollins College',
          school_motto: data.school_motto || 'Geared Towards Success',
        })
      }
    } catch (err) {
      console.error('Failed to load school settings:', err)
    }
  }

  async function checkExistingSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session) {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('auth_id', session.user.id)
        .maybeSingle()

      if (userData?.role === 'admin') {
        router.push('/admin')
      } else if (userData?.role === 'staff') {
        router.push('/staff')  // Changed to /staff
      } else if (userData?.role === 'student') {
        router.push('/student')  // Changed to /student
      }
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: password.trim(),
      })

      if (authError) {
        setError(`Login failed: ${authError.message}`)
        setLoading(false)
        return
      }

      if (authData?.user) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('auth_id', authData.user.id)
          .maybeSingle()

        if (userError) {
          console.error('Error getting user role:', userError)
          setError('Could not determine user role. Please contact administrator.')
          setLoading(false)
          return
        }

        if (!userData) {
          setError('User profile not found. Please contact administrator.')
          setLoading(false)
          return
        }

        if (userData.role !== selectedRole) {
          setError(`This account is for ${userData.role}. Please select the ${userData.role} tab.`)
          setLoading(false)
          return
        }

        toast.success(`Welcome back! Redirecting to ${userData.role} dashboard...`)

        if (userData.role === 'admin') {
          router.push('/admin')
        } else if (userData.role === 'staff') {
          router.push('/staff')  // Changed to /staff
        } else {
          router.push('/student')  // Changed to /student
        }
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getRoleColor = () => {
    switch (selectedRole) {
      case 'admin':
        return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'staff':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      default:
        return 'bg-green-100 text-green-700 border-green-200'
    }
  }

  const getRoleActiveColor = () => {
    switch (selectedRole) {
      case 'admin':
        return 'bg-purple-600'
      case 'staff':
        return 'bg-blue-600'
      default:
        return 'bg-green-600'
    }
  }

  const getRoleIcon = () => {
    switch (selectedRole) {
      case 'admin':
        return <Shield className="h-4 w-4" />
      case 'staff':
        return <Users className="h-4 w-4" />
      default:
        return <GraduationCap className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <Header />

      <div className="container mx-auto flex min-h-screen items-center justify-center px-4 pb-16 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto w-full max-w-md"
        >
          <Card className="overflow-hidden rounded-2xl border-0 shadow-2xl">
            <div className={`h-1 w-full ${getRoleActiveColor()}`} />

            <CardHeader className="px-6 pb-6 pt-10">
              <div className="flex flex-col items-center text-center">
                {schoolSettings?.logo_path && (
                  <div className="relative mb-4 flex h-24 w-24 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
                    <Image
                      src={schoolSettings.logo_path}
                      alt="School Logo"
                      fill
                      className="object-contain p-3"
                      unoptimized
                    />
                  </div>
                )}

                <CardTitle className="text-center text-2xl font-bold tracking-tight text-gray-900">
                  {schoolSettings?.school_name || 'Vincollins College'}
                </CardTitle>

                <CardDescription className="mt-1 text-center text-sm font-medium text-gray-500">
                  {schoolSettings?.school_motto || 'Geared Towards Success'}
                </CardDescription>

                <p className="mt-4 max-w-sm text-center text-sm leading-6 text-gray-600">
                  Sign in with your email and password
                </p>
              </div>
            </CardHeader>

            <CardContent>
              <Tabs
                value={selectedRole}
                onValueChange={(v) => setSelectedRole(v as 'student' | 'staff' | 'admin')}
                className="mb-6"
              >
                <TabsList className="grid w-full grid-cols-3 gap-2 bg-gray-100 p-1">
                  <TabsTrigger
                    value="student"
                    className="flex items-center gap-2 transition-all duration-200 data-[state=active]:bg-green-600 data-[state=active]:text-white"
                  >
                    <GraduationCap className="h-4 w-4" />
                    <span className="hidden sm:inline">Student</span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="staff"
                    className="flex items-center gap-2 transition-all duration-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
                    <Users className="h-4 w-4" />
                    <span className="hidden sm:inline">Staff</span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="admin"
                    className="flex items-center gap-2 transition-all duration-200 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                  >
                    <Shield className="h-4 w-4" />
                    <span className="hidden sm:inline">Admin</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className={`mb-6 rounded-lg border p-2 text-center text-xs ${getRoleColor()} opacity-80`}>
                {selectedRole === 'admin' && 'Full system access and control'}
                {selectedRole === 'staff' && 'Manage classes, exams, and grading'}
                {selectedRole === 'student' && 'Access your student dashboard'}
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50 text-red-800">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-purple-600" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border-gray-200 pl-10 focus:border-purple-400 focus:ring-purple-400"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password / VIN ID</Label>
                  <div className="relative group">
                    <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-purple-600" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password or VIN ID"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="border-gray-200 pl-10 pr-10 focus:border-purple-400 focus:ring-purple-400"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className={`w-full py-6 font-semibold text-white shadow-lg transition-all duration-200 hover:opacity-90 hover:shadow-xl ${getRoleActiveColor()}`}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      {getRoleIcon()}
                      <span className="ml-2">
                        Sign in as {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
                      </span>
                    </>
                  )}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pb-8">
              <p className="text-center text-sm text-gray-600">
                Need access?{' '}
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-1 font-medium text-purple-600 hover:underline"
                >
                  <MailIcon className="h-3 w-3" />
                  Contact Administrator
                </Link>
              </p>

              <div className="w-full border-t border-gray-100 pt-4">
                <div className="space-y-2 text-center text-xs text-gray-400">
                  <div className="flex flex-wrap items-center justify-center gap-4">
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      <span>+234 800 123 4567</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MailIcon className="h-3 w-3" />
                      <span>info@vincollins.edu.ng</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>Ikeja, Lagos</span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="pt-2 text-center text-xs text-gray-400">
                By signing in, you agree to our Terms of Service and Privacy Policy
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      </div>

      <Footer />
    </div>
  )
}