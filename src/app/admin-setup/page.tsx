/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, AlertCircle, Sparkles } from 'lucide-react'

export default function AdminSetupPage() {
  const [email, setEmail] = useState('vincollinscollege@gmail.com')
  const [password, setPassword] = useState('')
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [adminRoleId, setAdminRoleId] = useState('')
  const supabase = createClient()

  const generateRandomPassword = () => {
    const randomNum = Math.floor(Math.random() * 900000 + 100000).toString()
    const specialChars = ['!', '@', '#', '$', '%', '&', '*']
    const randomSpecial = specialChars[Math.floor(Math.random() * specialChars.length)]
    const newPassword = `VIN-ADM-${randomNum}${randomSpecial}`
    setPassword(newPassword)
    setGeneratedPassword(newPassword)
  }

  const handleSetup = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const finalPassword = password || generatedPassword
      if (!finalPassword) {
        setError('Please generate or enter a password')
        setIsLoading(false)
        return
      }

      console.log('Attempting to create admin with:', { email, passwordLength: finalPassword.length })
      
      // First, check if admin already exists in profiles
      const { data: existingProfiles, error: checkError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('role', 'admin')
        .limit(1)
      
      if (checkError) {
        console.error('Error checking existing profiles:', checkError)
      }
      
      if (existingProfiles && existingProfiles.length > 0) {
        setError('Admin already exists! Please login with existing admin account.')
        setIsLoading(false)
        return
      }
      
      // Check if user already exists in auth
      const { data: existingUser } = await supabase.auth.signInWithPassword({
        email,
        password: finalPassword,
      }).catch(() => ({ data: null }))
      
      if (existingUser?.user) {
        setError('User already exists. Please use a different email or login.')
        setIsLoading(false)
        return
      }
      
      // Create admin user in Supabase Auth
      console.log('Creating auth user...')
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: finalPassword,
        options: {
          data: {
            full_name: 'System Administrator',
            role: 'admin'
          },
          emailRedirectTo: `${window.location.origin}/portal`
        }
      })
      
      if (signUpError) {
        console.error('SignUp error details:', signUpError)
        setError(`Signup error: ${signUpError.message}`)
        setIsLoading(false)
        return
      }
      
      if (!authData.user) {
        setError('Failed to create user - no user returned')
        setIsLoading(false)
        return
      }
      
      console.log('Auth user created:', authData.user.id)
      
      // Generate role ID
      const randomNum = Math.floor(Math.random() * 900000 + 100000).toString()
      const roleId = `VIN-ADM-${randomNum}`
      setAdminRoleId(roleId)
      
      // Create admin profile
      console.log('Creating profile...')
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          full_name: 'System Administrator',
          first_name: 'System',
          last_name: 'Admin',
          email: email,
          role: 'admin',
          role_id: roleId,
          is_active: true,
          password_changed: false
        })
      
      if (profileError) {
        console.error('Profile error details:', profileError)
        setError(`Profile error: ${profileError.message}`)
        // Try to clean up the auth user if profile creation fails
        setIsLoading(false)
        return
      }
      
      console.log('Profile created successfully')
      setSuccess(true)
      
    } catch (err: any) {
      console.error('Setup error full details:', err)
      setError(err.message || 'Failed to create admin. Please check console for details.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <Card className="max-w-md w-full shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">Admin Created Successfully!</CardTitle>
            <CardDescription>Your admin account has been created</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <p className="font-semibold text-gray-700">Login Credentials:</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Email:</span>
                  <span className="text-sm font-mono bg-white px-2 py-1 rounded">{email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Password:</span>
                  <span className="text-sm font-mono bg-white px-2 py-1 rounded">{password || generatedPassword}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Role ID:</span>
                  <span className="text-sm font-mono bg-white px-2 py-1 rounded">{adminRoleId}</span>
                </div>
              </div>
            </div>
            
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800 text-sm">
                Please save these credentials. You'll need them to login.
              </AlertDescription>
            </Alert>
            
            <Button onClick={() => window.location.href = '/portal'} className="w-full bg-green-600 hover:bg-green-700">
              Go to Login Page
            </Button>
            
            <p className="text-xs text-center text-gray-500">
              For security, please remove or protect this setup page after first use.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <Card className="max-w-md w-full shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Admin Setup</CardTitle>
          <CardDescription>Create the first administrator account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">Admin Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@vincollins.edu.ng"
              className="border-gray-300"
            />
            <p className="text-xs text-gray-500">
              Use: vincollinscollege@gmail.com
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="flex gap-2">
              <Input
                id="password"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password or generate one"
                className="flex-1 border-gray-300"
              />
              <Button
                type="button"
                variant="outline"
                onClick={generateRandomPassword}
                className="whitespace-nowrap"
              >
                Generate
              </Button>
            </div>
            {generatedPassword && (
              <p className="text-sm text-green-600 mt-1">
                Generated: <span className="font-mono">{generatedPassword}</span>
              </p>
            )}
            <p className="text-xs text-gray-500">
              Password format: VIN-ADM-XXXXXX! (6 digits + special character)
            </p>
          </div>
          
          <Button 
            onClick={handleSetup} 
            disabled={isLoading} 
            className="w-full bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Admin Account...
              </>
            ) : (
              'Create Admin Account'
            )}
          </Button>
          
          <p className="text-xs text-gray-500 text-center mt-4">
            This will create the first admin account. You can add more users from the admin dashboard later.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}