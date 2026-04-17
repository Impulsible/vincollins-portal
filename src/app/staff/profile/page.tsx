/* eslint-disable @typescript-eslint/no-unused-vars */
// app/staff/profile/page.tsx - WORKING PHOTO UPLOAD WITH SYNC
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
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { 
  User, Mail, Phone, MapPin, BookOpen, Award, Calendar, 
  Camera, Save, X, Building, Clock, Shield, Key, Eye, EyeOff,
  CheckCircle, AlertCircle, ArrowLeft, Loader2, ChevronRight, Home
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
  const [isUploading, setIsUploading] = useState(false)
  const [avatarKey, setAvatarKey] = useState(Date.now())
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
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

      console.log('📸 Loading staff profile for:', session.user.id)

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()

      if (error) {
        console.error('Error fetching profile:', error)
      }

      console.log('📸 Current photo_url:', profileData?.photo_url)

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

  // FIXED: Working image upload - same as student version
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

    setIsUploading(true)
    
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `staff-${profile?.id}-${Date.now()}.${fileExt}`
      
      console.log('📸 Uploading staff photo:', fileName)

      // Upload to Supabase Storage - using same student-photos bucket
      const { error: uploadError } = await supabase.storage
        .from('student-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw uploadError
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('student-photos')
        .getPublicUrl(fileName)

      const publicUrl = urlData.publicUrl
      console.log('📸 Staff photo URL:', publicUrl)

      // Update profile with new photo URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          photo_url: publicUrl,
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile?.id)

      if (updateError) {
        console.error('Profile update error:', updateError)
        throw updateError
      }

      // Update local state
      setFormData(prev => ({ ...prev, photo_url: publicUrl }))
      if (profile) {
        setProfile({ ...profile, photo_url: publicUrl, avatar_url: publicUrl })
      }
      setAvatarKey(Date.now())
      
      toast.success('Profile photo updated successfully!')
      
      // Clear the input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
    } catch (error: any) {
      console.error('Error uploading image:', error)
      toast.error(error.message || 'Failed to upload image')
    } finally {
      setIsUploading(false)
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

  const formatProfileForHeader = () => {
    if (!profile) return undefined
    return {
      id: profile.id,
      name: profile.full_name,
      email: profile.email,
      role: 'teacher' as const,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col">
      <Header user={formatProfileForHeader()} onLogout={handleLogout} />
      
      <div className="flex flex-1">
        <StaffSidebar 
          profile={profile}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeTab="profile"
          setActiveTab={() => {}}
        />

        <div className={cn(
          "flex-1 transition-all duration-300",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
        )}>
          <main className="pt-20 lg:pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="container mx-auto max-w-5xl">
              
              {/* Breadcrumb */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 flex items-center justify-between"
              >
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Link href="/staff" className="hover:text-primary flex items-center gap-1">
                    <Home className="h-3.5 w-3.5" />
                    Dashboard
                  </Link>
                  <ChevronRight className="h-3.5 w-3.5" />
                  <span className="text-foreground font-medium">My Profile</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => router.push('/staff')}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Button>
              </motion.div>

              {/* Profile Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
                <p className="text-slate-500 mt-1">
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
                  <TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-100 p-1 rounded-xl">
                    <TabsTrigger value="profile" className="data-[state=active]:bg-white rounded-lg">
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </TabsTrigger>
                    <TabsTrigger value="security" className="data-[state=active]:bg-white rounded-lg">
                      <Shield className="h-4 w-4 mr-2" />
                      Security
                    </TabsTrigger>
                  </TabsList>

                  {/* Profile Tab */}
                  <TabsContent value="profile" className="space-y-6">
                    {/* Profile Card with Avatar */}
                    <Card className="border-0 shadow-lg overflow-hidden">
                      <div className="relative h-32 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600">
                        {!isEditing && (
                          <div className="absolute top-4 right-4">
                            <Button 
                              onClick={() => setIsEditing(true)} 
                              size="sm"
                              className="bg-white/90 text-blue-700 hover:bg-white shadow-md"
                            >
                              <User className="mr-2 h-4 w-4" />
                              Edit Profile
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      <CardContent className="px-6 pb-6">
                        <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
                          {/* Avatar Section */}
                          <div className="relative -mt-16">
                            <div className="relative">
                              <Avatar className="h-28 w-28 md:h-32 md:w-32 ring-4 ring-white shadow-xl" key={avatarKey}>
                                <AvatarImage src={formData.photo_url || profile?.photo_url || undefined} />
                                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-3xl font-bold">
                                  {getInitials()}
                                </AvatarFallback>
                              </Avatar>
                              
                              {isEditing && (
                                <button
                                  onClick={() => fileInputRef.current?.click()}
                                  disabled={isUploading}
                                  className="absolute -bottom-2 -right-2 p-2.5 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all"
                                >
                                  {isUploading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Camera className="h-4 w-4" />
                                  )}
                                </button>
                              )}
                            </div>
                            
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/jpeg,image/png,image/gif,image/webp"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                            
                            {isUploading && (
                              <p className="text-xs text-muted-foreground mt-2 text-center">Uploading...</p>
                            )}
                          </div>

                          {/* Basic Info */}
                          <div className="flex-1 text-center md:text-left pb-4">
                            {isEditing ? (
                              <div className="space-y-3">
                                <div>
                                  <Label htmlFor="full_name">Full Name</Label>
                                  <Input
                                    id="full_name"
                                    value={formData.full_name}
                                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                                    placeholder="Enter your full name"
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
                                <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
                                  {formData.full_name || 'Teacher Name'}
                                </h2>
                                <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
                                  <Badge className="bg-blue-100 text-blue-700">
                                    {formData.position || 'Teacher'}
                                  </Badge>
                                  <Badge variant="outline">
                                    {formData.department || 'Department'}
                                  </Badge>
                                  {formData.qualification && (
                                    <Badge variant="secondary">{formData.qualification}</Badge>
                                  )}
                                </div>
                                <p className="text-slate-500 mt-2 flex items-center justify-center md:justify-start gap-2">
                                  <Mail className="h-4 w-4" />
                                  {formData.email}
                                </p>
                              </>
                            )}
                          </div>

                          {/* Edit/Save Buttons */}
                          {isEditing && (
                            <div className="flex gap-2 md:self-end pb-4">
                              <Button variant="outline" onClick={handleCancel}>
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                              </Button>
                              <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                                {saving ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                  <Save className="h-4 w-4 mr-2" />
                                )}
                                Save
                              </Button>
                            </div>
                          )}
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
                                className="resize-none"
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
                                className="resize-none"
                              />
                            </div>
                          </>
                        ) : (
                          <div className="space-y-4">
                            <InfoCard icon={Phone} label="Phone" value={formData.phone || 'Not provided'} />
                            <InfoCard icon={MapPin} label="Address" value={formData.address || 'Not provided'} />
                            {formData.bio && <InfoCard icon={User} label="Bio" value={formData.bio} />}
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
                                placeholder="e.g., Mathematics, Physics"
                              />
                            </div>
                          </>
                        ) : (
                          <div className="space-y-4">
                            <InfoCard icon={Award} label="Qualification" value={formData.qualification || 'Not provided'} />
                            <InfoCard icon={Clock} label="Experience" value={formData.experience || 'Not provided'} />
                            <InfoCard icon={BookOpen} label="Subjects" value={formData.subjects || 'Not provided'} />
                            <InfoCard icon={Building} label="Department" value={formData.department || 'Not assigned'} />
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
                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
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

                        {!showPasswordForm ? (
                          <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-200">
                            <div className="flex items-center gap-3">
                              <Key className="h-5 w-5 text-amber-600" />
                              <div>
                                <p className="font-medium text-amber-800">Password</p>
                                <p className="text-sm text-amber-600">Change your password regularly</p>
                              </div>
                            </div>
                            <Button variant="outline" onClick={() => setShowPasswordForm(true)}>
                              Change Password
                            </Button>
                          </div>
                        ) : (
                          <div className="p-4 bg-slate-50 rounded-xl space-y-4">
                            <h4 className="font-semibold">Change Password</h4>
                            
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
                                  {showNewPassword ? <EyeOff className="h-4 w-4 text-slate-400" /> : <Eye className="h-4 w-4 text-slate-400" />}
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
                                  {showConfirmPassword ? <EyeOff className="h-4 w-4 text-slate-400" /> : <Eye className="h-4 w-4 text-slate-400" />}
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
                                  setNewPassword('')
                                  setConfirmPassword('')
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleChangePassword}
                                disabled={changingPassword || !newPassword || newPassword !== confirmPassword}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                {changingPassword && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                Update Password
                              </Button>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                          <Shield className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium text-green-800">Account Status</p>
                            <p className="text-sm text-green-600">Your account is active and secure</p>
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

// Helper component for info cards
function InfoCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
      <div className="p-2 bg-white rounded-lg shrink-0">
        <Icon className="h-4 w-4 text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
        <p className="font-medium text-slate-900 break-words">{value}</p>
      </div>
    </div>
  )
}