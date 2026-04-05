/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  LogIn, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  GraduationCap,
  Shield,
  Users,
  Loader2,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

interface LoginFormData {
  email: string
  password: string
}

interface SchoolSettings {
  logo_path: string
  school_name: string
  school_motto: string
}

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rememberMe, setRememberMe] = useState(false)
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>({
    logo_path: '/images/logo.png',
    school_name: 'Vincollins College',
    school_motto: 'Geared Towards Success'
  })

  // Define fetchSchoolSettings BEFORE it's used in useEffect
  const fetchSchoolSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/school-settings')
      const data = await response.json()
      if (data) {
        setSchoolSettings({
          logo_path: data.logo_path || '/images/logo.png',
          school_name: data.school_name || 'Vincollins College',
          school_motto: data.school_motto || 'Geared Towards Success'
        })
      }
    } catch (error) {
      console.error('Error fetching school settings:', error)
      // Use defaults if fetch fails
      setSchoolSettings({
        logo_path: '/images/logo.png',
        school_name: 'Vincollins College',
        school_motto: 'Geared Towards Success'
      })
    }
  }, [])

  // Fetch school settings on mount
  useEffect(() => {
    fetchSchoolSettings()
  }, [fetchSchoolSettings])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
        setIsLoading(false)
        return
      }

      // Get user role from session
      const response = await fetch('/api/auth/session')
      const session = await response.json()
      
      // Redirect based on role
      const role = session?.user?.role
      if (role === 'admin') {
        router.push('/admin/dashboard')
      } else if (role === 'teacher') {
        router.push('/teacher/dashboard')
      } else if (role === 'student') {
        router.push('/student/dashboard')
      } else {
        router.push('/dashboard')
      }
      
      toast.success('Login successful!')
    } catch (error) {
      setError('An error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  const handleDemoLogin = async (role: 'student' | 'teacher' | 'admin') => {
    setIsLoading(true)
    setError(null)

    try {
      const demoCredentials = {
        student: { email: 'student@vincollins.edu.ng', password: 'student123' },
        teacher: { email: 'teacher@vincollins.edu.ng', password: 'teacher123' },
        admin: { email: 'admin@vincollins.edu.ng', password: 'admin123' }
      }

      const result = await signIn('credentials', {
        email: demoCredentials[role].email,
        password: demoCredentials[role].password,
        redirect: false,
      })

      if (result?.error) {
        setError('Demo login failed. Please check if demo accounts exist.')
        setIsLoading(false)
        return
      }

      router.push(role === 'admin' ? '/admin/dashboard' : `/${role}/dashboard`)
      toast.success(`Logged in as ${role}`)
    } catch (error) {
      setError('An error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <Header />
      
      <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[calc(100vh-200px)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="border-0 shadow-2xl">
            <CardHeader className="space-y-4 text-center">
              {/* School Logo */}
              <div className="relative mx-auto">
                <div className="relative w-24 h-24 mx-auto mb-2">
                  <Image
                    src={schoolSettings.logo_path}
                    alt="School Logo"
                    fill
                    className="object-contain rounded-full"
                    priority
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/images/logo.png'
                    }}
                  />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{schoolSettings.school_name}</h2>
                <p className="text-sm text-gray-500">{schoolSettings.school_motto}</p>
                <CardDescription className="pt-2">
                  Sign in to access your dashboard
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-10"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="pl-10 pr-10"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-600">Remember me</span>
                  </label>
                  <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>

              {/* Demo Login Section */}
              <div className="mt-6 pt-4 border-t">
                <p className="text-center text-sm text-gray-500 mb-3">Demo Login (Testing only)</p>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDemoLogin('student')}
                    disabled={isLoading}
                    className="flex flex-col items-center py-2 h-auto"
                  >
                    <GraduationCap className="h-4 w-4 mb-1" />
                    <span className="text-xs">Student</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDemoLogin('teacher')}
                    disabled={isLoading}
                    className="flex flex-col items-center py-2 h-auto"
                  >
                    <Users className="h-4 w-4 mb-1" />
                    <span className="text-xs">Teacher</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDemoLogin('admin')}
                    disabled={isLoading}
                    className="flex flex-col items-center py-2 h-auto"
                  >
                    <Shield className="h-4 w-4 mb-1" />
                    <span className="text-xs">Admin</span>
                  </Button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <p className="text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <Link href="/auth/register" className="text-primary hover:underline font-medium">
                  Create an account
                </Link>
              </p>
              <p className="text-center text-xs text-gray-400">
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