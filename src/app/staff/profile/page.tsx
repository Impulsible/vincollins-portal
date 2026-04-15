/* eslint-disable @typescript-eslint/no-unused-vars */
// app/staff/profile/page.tsx
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { StaffSidebar } from '@/components/staff/StaffSidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  BookOpen, 
  Award, 
  Calendar, 
  Camera, 
  Save, 
  X, 
  Building, 
  Clock,
  Shield,
  Key,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

interface StaffProfile {
  id: string
  full_name: string
  email: string
  phone?: string
  address?: string
  department: string
  position: string
  qualification?: string
  experience?: string
  bio?: string
  subjects?: string
  photo_url?: string
  avatar_url?: string
  class?: string
  created_at?: string
  updated_at?: string
}

export default function StaffProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<StaffProfile | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    department: '',
    position: '',
    qualification: '',
    experience: '',
    bio: '',
    subjects: '',
    photo_url: '',
  })

  const loadProfile = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/portal')
        return
      }

      // Fetch profile from profiles table
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error)
      }

      if (profileData) {
        setProfile(profileData as StaffProfile)
        setFormData({
          full_name: profileData.full_name || '',
          email: profileData.email || session.user.email || '',
          phone: profileData.phone || '',
          address: profileData.address || '',
          department: profileData.department || '',
          position: profileData.position || '',
          qualification: profileData.qualification || '',
          experience: profileData.experience || '',
          bio: profileData.bio || '',
          subjects: profileData.subjects || '',
          photo_url: profileData.photo_url || profileData.avatar_url || '',
        })
      } else {
        // Create basic profile from session
        const emailName = session.user.email?.split('@')[0] || 'Teacher'
        const formattedName = emailName.split('.').map((part: string) => 
          part.charAt(0).toUpperCase() + part.slice(1)
        ).join(' ')
        
        const basicProfile = {
          id: session.user.id,
          full_name: formattedName,
          email: session.user.email || '',
          department: 'General',
          position: 'Teacher',
        }
        setProfile(basicProfile as StaffProfile)
        setFormData({
          full_name: basicProfile.full_name,
          email: basicProfile.email,
          phone: '',
          address: '',
          department: basicProfile.department,
          position: basicProfile.position,
          qualification: '',
          experience: '',
          bio: '',
          subjects: '',
          photo_url: '',
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/portal')
  }

  const getInitials = () => {
    if (!formData.full_name) return 'T'
    const names = formData.full_name.split(' ')
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase()
    }
    return names[0].slice(0, 2).toUpperCase()
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB')
      return
    }

    setUploading(true)
    
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${profile?.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setFormData(prev => ({ ...prev, photo_url: publicUrl }))
      
      // Update profile immediately with new photo
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: profile?.id,
          photo_url: publicUrl,
          updated_at: new Date().toISOString(),
        })

      if (updateError) throw updateError

      toast.success('Profile photo updated successfully!')
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/portal')
        return
      }

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          full_name: formData.full_name,
          phone: formData.phone,
          address: formData.address,
          department: formData.department,
          position: formData.position,
          qualification: formData.qualification,
          experience: formData.experience,
          bio: formData.bio,
          subjects: formData.subjects,
          photo_url: formData.photo_url,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error

      setProfile(prev => ({ ...prev, ...formData } as StaffProfile))
      toast.success('Profile updated successfully!')
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setChangingPassword(true)
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      toast.success('Password changed successfully!')
      setShowPasswordForm(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      console.error('Error changing password:', error)
      toast.error('Failed to change password')
    } finally {
      setChangingPassword(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        department: profile.department || '',
        position: profile.position || '',
        qualification: profile.qualification || '',
        experience: profile.experience || '',
        bio: profile.bio || '',
        subjects: profile.subjects || '',
        photo_url: profile.photo_url || '',
      })
    }
    setIsEditing(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <Header onLogout={handleLogout} />
        <div className="flex">
          <div className="hidden lg:block w-72" />
          <div className="flex-1">
            <main className="pt-20 pb-8">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
                <div className="space-y-6">
                  <Skeleton className="h-48 w-full rounded-2xl" />
                  <Skeleton className="h-96 w-full rounded-2xl" />
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Header onLogout={handleLogout} />
      
      <div className="flex">
        <StaffSidebar 
          profile={profile}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeTab="profile"
          setActiveTab={() => {}}
        />

        <div className="flex-1">
          <main className="pt-20 pb-8">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
              {/* Back Button */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-6"
              >
                <Link href="/staff">
                  <Button variant="ghost" className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                  </Button>
                </Link>
              </motion.div>

              {/* Profile Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  My Profile
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                  Manage your personal information and account settings
                </p>
              </motion.div>

              {/* Profile Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                  <TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <TabsTrigger value="profile" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 rounded-lg">
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </TabsTrigger>
                    <TabsTrigger value="security" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 rounded-lg">
                      <Shield className="h-4 w-4 mr-2" />
                      Security
                    </TabsTrigger>
                  </TabsList>

                  {/* Profile Tab */}
                  <TabsContent value="profile" className="space-y-6">
                    {/* Profile Card with Avatar */}
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                          {/* Avatar Section */}
                          <div className="relative group">
                            <div className="relative">
                              <Avatar className="h-28 w-28 md:h-32 md:w-32 ring-4 ring-primary/20 shadow-xl">
                                <AvatarImage src={formData.photo_url} />
                                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-3xl font-bold">
                                  {getInitials()}
                                </AvatarFallback>
                              </Avatar>
                              
                              {isEditing && (
                                <button
                                  onClick={() => fileInputRef.current?.click()}
                                  disabled={uploading}
                                  className="absolute -bottom-2 -right-2 p-2 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-all"
                                >
                                  {uploading ? (
                                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <Camera className="h-4 w-4" />
                                  )}
                                </button>
                              )}
                            </div>
                            
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                          </div>

                          {/* Basic Info */}
                          <div className="flex-1 text-center md:text-left">
                            {isEditing ? (
                              <div className="space-y-3">
                                <div>
                                  <Label htmlFor="full_name">Full Name</Label>
                                  <Input
                                    id="full_name"
                                    value={formData.full_name}
                                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                                    placeholder="Enter your full name"
                                    className="mt-1"
                                  />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <Label htmlFor="position">Position</Label>
                                    <Input
                                      id="position"
                                      value={formData.position}
                                      onChange={(e) => handleInputChange('position', e.target.value)}
                                      placeholder="e.g., Senior Teacher"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="department">Department</Label>
                                    <Select value={formData.department} onValueChange={(value) => handleInputChange('department', value)}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select department" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Science">Science</SelectItem>
                                        <SelectItem value="Mathematics">Mathematics</SelectItem>
                                        <SelectItem value="English">English</SelectItem>
                                        <SelectItem value="Humanities">Humanities</SelectItem>
                                        <SelectItem value="Arts">Arts</SelectItem>
                                        <SelectItem value="Technology">Technology</SelectItem>
                                        <SelectItem value="General">General</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <>
                                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                                  {formData.full_name || 'Teacher Name'}
                                </h2>
                                <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
                                  <Badge className="bg-primary/10 text-primary border-primary/20">
                                    {formData.position || 'Teacher'}
                                  </Badge>
                                  <Badge variant="outline">
                                    {formData.department || 'Department'}
                                  </Badge>
                                  {formData.qualification && (
                                    <Badge variant="secondary">{formData.qualification}</Badge>
                                  )}
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-center md:justify-start gap-2">
                                  <Mail className="h-4 w-4" />
                                  {formData.email}
                                </p>
                              </>
                            )}
                          </div>

                          {/* Edit/Save Buttons */}
                          <div className="flex gap-2">
                            {isEditing ? (
                              <>
                                <Button
                                  variant="outline"
                                  onClick={handleCancel}
                                  className="gap-2"
                                >
                                  <X className="h-4 w-4" />
                                  Cancel
                                </Button>
                                <Button
                                  onClick={handleSave}
                                  disabled={saving}
                                  className="gap-2 bg-primary"
                                >
                                  {saving ? (
                                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <Save className="h-4 w-4" />
                                  )}
                                  Save
                                </Button>
                              </>
                            ) : (
                              <Button
                                onClick={() => setIsEditing(true)}
                                className="gap-2"
                              >
                                <User className="h-4 w-4" />
                                Edit Profile
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Detailed Information */}
                    <Card className="border-0 shadow-lg">
                      <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>Your personal contact details</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {isEditing ? (
                          <>
                            <div>
                              <Label htmlFor="phone">Phone Number</Label>
                              <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                placeholder="+234 XXX XXX XXXX"
                              />
                            </div>
                            <div>
                              <Label htmlFor="address">Address</Label>
                              <Textarea
                                id="address"
                                value={formData.address}
                                onChange={(e) => handleInputChange('address', e.target.value)}
                                placeholder="Your address"
                                rows={2}
                              />
                            </div>
                            <div>
                              <Label htmlFor="bio">Bio</Label>
                              <Textarea
                                id="bio"
                                value={formData.bio}
                                onChange={(e) => handleInputChange('bio', e.target.value)}
                                placeholder="Tell us about yourself..."
                                rows={4}
                              />
                            </div>
                          </>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                              <Phone className="h-5 w-5 text-primary" />
                              <div>
                                <p className="text-sm text-slate-500">Phone</p>
                                <p className="font-medium">{formData.phone || 'Not provided'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                              <MapPin className="h-5 w-5 text-primary" />
                              <div>
                                <p className="text-sm text-slate-500">Address</p>
                                <p className="font-medium">{formData.address || 'Not provided'}</p>
                              </div>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                              <p className="text-sm text-slate-500 mb-2">Bio</p>
                              <p className="text-slate-700 dark:text-slate-300">
                                {formData.bio || 'No bio provided yet.'}
                              </p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Professional Information */}
                    <Card className="border-0 shadow-lg">
                      <CardHeader>
                        <CardTitle>Professional Information</CardTitle>
                        <CardDescription>Your teaching qualifications and experience</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {isEditing ? (
                          <>
                            <div>
                              <Label htmlFor="qualification">Highest Qualification</Label>
                              <Input
                                id="qualification"
                                value={formData.qualification}
                                onChange={(e) => handleInputChange('qualification', e.target.value)}
                                placeholder="e.g., M.Ed., B.Sc."
                              />
                            </div>
                            <div>
                              <Label htmlFor="experience">Years of Experience</Label>
                              <Input
                                id="experience"
                                value={formData.experience}
                                onChange={(e) => handleInputChange('experience', e.target.value)}
                                placeholder="e.g., 5 years"
                              />
                            </div>
                            <div>
                              <Label htmlFor="subjects">Subjects Taught</Label>
                              <Input
                                id="subjects"
                                value={formData.subjects}
                                onChange={(e) => handleInputChange('subjects', e.target.value)}
                                placeholder="e.g., Mathematics, Physics, Chemistry"
                              />
                            </div>
                          </>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                              <Award className="h-5 w-5 text-primary" />
                              <div>
                                <p className="text-sm text-slate-500">Qualification</p>
                                <p className="font-medium">{formData.qualification || 'Not provided'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                              <Clock className="h-5 w-5 text-primary" />
                              <div>
                                <p className="text-sm text-slate-500">Experience</p>
                                <p className="font-medium">{formData.experience || 'Not provided'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                              <BookOpen className="h-5 w-5 text-primary" />
                              <div>
                                <p className="text-sm text-slate-500">Subjects</p>
                                <p className="font-medium">{formData.subjects || 'Not provided'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                              <Building className="h-5 w-5 text-primary" />
                              <div>
                                <p className="text-sm text-slate-500">Department</p>
                                <p className="font-medium">{formData.department || 'Not assigned'}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Security Tab */}
                  <TabsContent value="security" className="space-y-6">
                    <Card className="border-0 shadow-lg">
                      <CardHeader>
                        <CardTitle>Account Security</CardTitle>
                        <CardDescription>Manage your password and account settings</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Email Info */}
                        <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                          <Mail className="h-5 w-5 text-primary" />
                          <div className="flex-1">
                            <p className="text-sm text-slate-500">Email Address</p>
                            <p className="font-medium">{formData.email}</p>
                          </div>
                          <Badge variant="outline" className="gap-1">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            Verified
                          </Badge>
                        </div>

                        {/* Password Section */}
                        {!showPasswordForm ? (
                          <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800">
                            <div className="flex items-center gap-3">
                              <Key className="h-5 w-5 text-amber-600" />
                              <div>
                                <p className="font-medium text-amber-800 dark:text-amber-200">Password</p>
                                <p className="text-sm text-amber-600 dark:text-amber-400">Change your password regularly for security</p>
                              </div>
                            </div>
                            <Button 
                              variant="outline" 
                              onClick={() => setShowPasswordForm(true)}
                              className="border-amber-300 dark:border-amber-700"
                            >
                              Change Password
                            </Button>
                          </div>
                        ) : (
                          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-4">
                            <h4 className="font-semibold">Change Password</h4>
                            
                            <div>
                              <Label htmlFor="currentPassword">Current Password</Label>
                              <div className="relative">
                                <Input
                                  id="currentPassword"
                                  type={showCurrentPassword ? 'text' : 'password'}
                                  value={currentPassword}
                                  onChange={(e) => setCurrentPassword(e.target.value)}
                                  placeholder="Enter current password"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2"
                                >
                                  {showCurrentPassword ? (
                                    <EyeOff className="h-4 w-4 text-slate-400" />
                                  ) : (
                                    <Eye className="h-4 w-4 text-slate-400" />
                                  )}
                                </button>
                              </div>
                            </div>

                            <div>
                              <Label htmlFor="newPassword">New Password</Label>
                              <div className="relative">
                                <Input
                                  id="newPassword"
                                  type={showNewPassword ? 'text' : 'password'}
                                  value={newPassword}
                                  onChange={(e) => setNewPassword(e.target.value)}
                                  placeholder="Enter new password"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowNewPassword(!showNewPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2"
                                >
                                  {showNewPassword ? (
                                    <EyeOff className="h-4 w-4 text-slate-400" />
                                  ) : (
                                    <Eye className="h-4 w-4 text-slate-400" />
                                  )}
                                </button>
                              </div>
                            </div>

                            <div>
                              <Label htmlFor="confirmPassword">Confirm New Password</Label>
                              <div className="relative">
                                <Input
                                  id="confirmPassword"
                                  type={showConfirmPassword ? 'text' : 'password'}
                                  value={confirmPassword}
                                  onChange={(e) => setConfirmPassword(e.target.value)}
                                  placeholder="Confirm new password"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2"
                                >
                                  {showConfirmPassword ? (
                                    <EyeOff className="h-4 w-4 text-slate-400" />
                                  ) : (
                                    <Eye className="h-4 w-4 text-slate-400" />
                                  )}
                                </button>
                              </div>
                            </div>

                            {newPassword && confirmPassword && newPassword !== confirmPassword && (
                              <div className="flex items-center gap-2 text-red-500 text-sm">
                                <AlertCircle className="h-4 w-4" />
                                Passwords do not match
                              </div>
                            )}

                            <div className="flex gap-2 pt-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setShowPasswordForm(false)
                                  setCurrentPassword('')
                                  setNewPassword('')
                                  setConfirmPassword('')
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleChangePassword}
                                disabled={changingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword}
                                className="bg-primary"
                              >
                                {changingPassword ? (
                                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                ) : null}
                                Update Password
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Account Status */}
                        <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-800">
                          <Shield className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium text-green-800 dark:text-green-200">Account Status</p>
                            <p className="text-sm text-green-600 dark:text-green-400">Your account is active and secure</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </motion.div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}