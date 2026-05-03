/* eslint-disable @typescript-eslint/no-unused-vars */
// app/staff/profile/page.tsx - FULLY RESPONSIVE, PHOTO UPLOAD & PROFILE SAVE
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
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
  CheckCircle, AlertCircle, ArrowLeft, Loader2, ChevronRight, Home,
  Hash, Lock
} from 'lucide-react'
import Link from 'next/link'

// ============================================
// TYPES
// ============================================
interface StaffProfile {
  id: string
  full_name: string
  email: string
  phone?: string | null
  address?: string | null
  department: string
  position: string
  qualification?: string | null
  experience?: string | null
  bio?: string | null
  subjects?: string | null
  photo_url?: string | null
  avatar_url?: string | null
  vin_id?: string | null
  class?: string
  role?: string
  created_at?: string
  updated_at?: string
}

// ============================================
// HELPER COMPONENTS
// ============================================
function InfoCard({ icon: Icon, label, value, className }: { icon: React.ElementType; label: string; value: string; className?: string }) {
  return (
    <div className={cn("flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 bg-slate-50 rounded-xl", className)}>
      <div className="p-1.5 sm:p-2 bg-white rounded-lg shrink-0 shadow-sm">
        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] sm:text-xs text-slate-500 mb-0.5">{label}</p>
        <p className="font-medium text-slate-900 text-xs sm:text-sm break-words">{value}</p>
      </div>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <Skeleton className="h-32 sm:h-40 w-full rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <Skeleton className="h-64 sm:h-80 rounded-2xl" />
        <Skeleton className="h-64 sm:h-80 rounded-2xl" />
      </div>
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function StaffProfilePage() {
  const router = useRouter()
  
  // State
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<StaffProfile | null>(null)
  const [activeTab, setActiveTab] = useState('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [avatarKey, setAvatarKey] = useState(Date.now())
  const [avatarError, setAvatarError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Form data
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
    vin_id: '',
  })

  // ============================================
  // LOAD PROFILE
  // ============================================
  const loadProfile = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/portal')
        return
      }

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()

      if (error) {
        console.error('Error fetching profile:', error)
        toast.error('Failed to load profile')
        return
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
          vin_id: profileData.vin_id || '',
        })
      } else {
        const emailName = session.user.email?.split('@')[0] || 'Teacher'
        const formattedName = emailName
          .split(/[._-]/)
          .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ')
        
        // Generate VIN ID if not exists
        const vinId = `VIN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`
        
        const basicProfile: StaffProfile = {
          id: session.user.id,
          full_name: formattedName,
          email: session.user.email || '',
          department: 'General',
          position: 'Teacher',
          role: 'staff',
          vin_id: vinId,
        }
        
        const { error: insertError } = await supabase
          .from('profiles')
          .upsert({
            id: session.user.id,
            full_name: basicProfile.full_name,
            email: basicProfile.email,
            department: basicProfile.department,
            position: basicProfile.position,
            role: 'staff',
            vin_id: vinId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

        if (insertError) {
          console.error('Error creating profile:', insertError)
        }

        setProfile(basicProfile)
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
          vin_id: vinId,
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

  // ============================================
  // HANDLERS
  // ============================================
  const getInitials = () => {
    if (!formData.full_name) return 'ST'
    const names = formData.full_name.trim().split(/\s+/)
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase()
    }
    return names[0].slice(0, 2).toUpperCase()
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // ============================================
  // PHOTO UPLOAD WITH PERSISTENCE
  // ============================================
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPEG, PNG, GIF, WebP)')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB')
      return
    }

    setIsUploading(true)
    setAvatarError(false)
    
    try {
      if (profile?.photo_url) {
        const oldPath = profile.photo_url.split('/').pop()
        if (oldPath) {
          await supabase.storage
            .from('student-photos')
            .remove([oldPath])
        }
      }

      const fileExt = file.name.split('.').pop() || 'jpg'
      const fileName = `staff-${profile?.id}-${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('student-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('student-photos')
        .getPublicUrl(fileName)

      const publicUrl = urlData.publicUrl

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          photo_url: publicUrl,
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile?.id)

      if (updateError) throw updateError

      setFormData(prev => ({ ...prev, photo_url: publicUrl }))
      if (profile) {
        setProfile(prev => prev ? { ...prev, photo_url: publicUrl, avatar_url: publicUrl } : null)
      }
      setAvatarKey(Date.now())
      
      toast.success('Profile photo updated successfully!')
      
    } catch (error: any) {
      console.error('Error uploading image:', error)
      toast.error(error.message || 'Failed to upload image')
      setAvatarError(true)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // ============================================
  // SAVE PROFILE
  // ============================================
  const handleSave = async () => {
    if (!formData.full_name.trim()) {
      toast.error('Full name is required')
      return
    }

    setSaving(true)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/portal')
        return
      }

      const updateData = {
        id: session.user.id,
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim() || null,
        address: formData.address.trim() || null,
        department: formData.department.trim() || 'General',
        position: formData.position.trim() || 'Teacher',
        qualification: formData.qualification.trim() || null,
        experience: formData.experience.trim() || null,
        bio: formData.bio.trim() || null,
        subjects: formData.subjects.trim() || null,
        photo_url: formData.photo_url || null,
        avatar_url: formData.photo_url || null,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('profiles')
        .upsert(updateData, { onConflict: 'id' })

      if (error) throw error

      setProfile(prev => {
        if (!prev) return null
        return {
          ...prev,
          ...updateData,
        }
      })

      toast.success('Profile updated successfully!')
      setIsEditing(false)
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  // ============================================
  // CANCEL EDITING
  // ============================================
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
        vin_id: profile.vin_id || '',
      })
    }
    setIsEditing(false)
    setAvatarError(false)
  }

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return (
      <div className="w-full max-w-screen-xl mx-auto px-3 sm:px-4 md:px-5 lg:px-6 py-6 sm:py-8 md:py-10 lg:py-12">
        <ProfileSkeleton />
      </div>
    )
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="w-full max-w-screen-xl mx-auto px-3 sm:px-4 md:px-5 lg:px-6 py-6 sm:py-8 md:py-10 lg:py-12">
      
      {/* Breadcrumb & Back Button */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-3 sm:mb-4 md:mb-6 flex flex-wrap items-center justify-between gap-2 sm:gap-3"
      >
        <div className="flex items-center gap-1 sm:gap-2 text-[11px] sm:text-xs md:text-sm text-muted-foreground flex-wrap">
          <Link href="/staff" className="hover:text-primary flex items-center gap-1 transition-colors">
            <Home className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="hidden xs:inline">Dashboard</span>
          </Link>
          <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
          <span className="text-foreground font-medium truncate">My Profile</span>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.push('/staff')} 
          className="h-7 sm:h-8 md:h-9 text-[11px] sm:text-xs md:text-sm flex-shrink-0"
        >
          <ArrowLeft className="mr-1 sm:mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5" />
          <span className="hidden xs:inline">Back to Dashboard</span>
          <span className="xs:hidden">Back</span>
        </Button>
      </motion.div>

      {/* Page Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-3 sm:mb-4 md:mb-6"
      >
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-slate-900">My Profile</h1>
        <p className="text-[11px] sm:text-xs md:text-sm text-slate-500 mt-0.5 sm:mt-1">
          Manage your personal information and account settings
        </p>
      </motion.div>

      {/* Profile Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3 sm:space-y-4 md:space-y-6">
          <TabsList className="grid w-full max-w-[240px] sm:max-w-[280px] md:max-w-md grid-cols-2 bg-slate-100 p-1 rounded-xl">
            <TabsTrigger value="profile" className="data-[state=active]:bg-white rounded-lg text-[11px] sm:text-xs md:text-sm py-1.5 sm:py-2">
              <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-1 sm:mr-1.5" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-white rounded-lg text-[11px] sm:text-xs md:text-sm py-1.5 sm:py-2">
              <Shield className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-1 sm:mr-1.5" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* ============================================ */}
          {/* PROFILE TAB */}
          {/* ============================================ */}
          <TabsContent value="profile" className="space-y-3 sm:space-y-4 md:space-y-6">
            {/* Profile Card with Avatar */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="relative h-20 sm:h-24 md:h-28 lg:h-32 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600">
                {!isEditing && (
                  <div className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4">
                    <Button 
                      onClick={() => setIsEditing(true)} 
                      size="sm"
                      className="bg-white/90 text-blue-700 hover:bg-white shadow-md h-7 sm:h-8 text-[11px] sm:text-xs"
                    >
                      <User className="mr-1 sm:mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      Edit Profile
                    </Button>
                  </div>
                )}
              </div>
              
              <CardContent className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-end gap-3 sm:gap-4 md:gap-6">
                  {/* Avatar Section */}
                  <div className="relative -mt-10 sm:-mt-12 md:-mt-16">
                    <div className="relative">
                      <Avatar 
                        className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 lg:h-28 lg:w-28 ring-4 ring-white shadow-xl" 
                        key={avatarKey}
                      >
                        <AvatarImage 
                          src={formData.photo_url || undefined} 
                          onError={() => setAvatarError(true)}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                      
                      {isEditing && (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 p-1.5 sm:p-2 md:p-2.5 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all disabled:opacity-50"
                          title="Upload photo"
                        >
                          {isUploading ? (
                            <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 animate-spin" />
                          ) : (
                            <Camera className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
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
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2 text-center">Uploading...</p>
                    )}
                    {isEditing && !isUploading && (
                      <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-1 text-center max-w-[80px] sm:max-w-[100px]">
                        Click camera to upload photo
                      </p>
                    )}
                  </div>

                  {/* Basic Info */}
                  <div className="flex-1 text-center sm:text-left pb-2 sm:pb-3 md:pb-4 min-w-0">
                    {isEditing ? (
                      <div className="space-y-2 sm:space-y-3">
                        <div>
                          <Label htmlFor="full_name" className="text-[11px] sm:text-xs md:text-sm">Full Name *</Label>
                          <Input
                            id="full_name"
                            value={formData.full_name}
                            onChange={(e) => handleInputChange('full_name', e.target.value)}
                            placeholder="Enter your full name"
                            className="h-8 sm:h-9 md:h-10 text-xs sm:text-sm"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                          <div>
                            <Label htmlFor="position" className="text-[11px] sm:text-xs md:text-sm">Position</Label>
                            <Input
                              id="position"
                              value={formData.position}
                              onChange={(e) => handleInputChange('position', e.target.value)}
                              placeholder="e.g., Senior Teacher"
                              className="h-8 sm:h-9 md:h-10 text-xs sm:text-sm"
                            />
                          </div>
                          <div>
                            <Label htmlFor="department" className="text-[11px] sm:text-xs md:text-sm">Department</Label>
                            <Select value={formData.department} onValueChange={(value) => handleInputChange('department', value)}>
                              <SelectTrigger className="h-8 sm:h-9 md:h-10 text-xs sm:text-sm">
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
                      <div className="min-w-0">
                        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-slate-900 truncate">
                          {formData.full_name || 'Teacher Name'}
                        </h2>
                        <div className="flex flex-wrap justify-center sm:justify-start gap-1 sm:gap-1.5 md:gap-2 mt-1 sm:mt-1.5 md:mt-2">
                          <Badge className="bg-blue-100 text-blue-700 text-[10px] sm:text-xs">
                            {formData.position || 'Teacher'}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] sm:text-xs">
                            {formData.department || 'Department'}
                          </Badge>
                          {formData.qualification && (
                            <Badge variant="secondary" className="text-[10px] sm:text-xs">{formData.qualification}</Badge>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1 sm:mt-1.5 md:mt-2 text-[11px] sm:text-xs md:text-sm text-slate-500">
                          <div className="flex items-center justify-center sm:justify-start gap-1">
                            <Mail className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 flex-shrink-0" />
                            <span className="truncate">{formData.email}</span>
                          </div>
                          {formData.vin_id && (
                            <>
                              <span className="hidden sm:inline text-slate-300">•</span>
                              <div className="flex items-center justify-center sm:justify-start gap-1">
                                <Hash className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 flex-shrink-0" />
                                <span className="font-mono text-[10px] sm:text-xs">{formData.vin_id}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Edit/Save Buttons - Desktop */}
                  {isEditing && (
                    <div className="hidden sm:flex gap-2 self-end pb-2 sm:pb-3 md:pb-4 flex-shrink-0">
                      <Button variant="outline" onClick={handleCancel} className="h-8 sm:h-9 text-[11px] sm:text-xs">
                        <X className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5" />
                        Cancel
                      </Button>
                      <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 h-8 sm:h-9 text-[11px] sm:text-xs">
                        {saving ? (
                          <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin mr-1 sm:mr-1.5" />
                        ) : (
                          <Save className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5" />
                        )}
                        {saving ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Edit/Save Buttons - Mobile */}
                {isEditing && (
                  <div className="flex sm:hidden gap-2 mt-3 justify-end">
                    <Button variant="outline" size="sm" onClick={handleCancel} className="h-8 text-[11px]">
                      <X className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 h-8 text-[11px]">
                      {saving ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <Save className="h-3 w-3 mr-1" />
                      )}
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Detailed Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              {/* Personal Information */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-4 md:px-6">
                  <CardTitle className="text-sm sm:text-base md:text-lg">Personal Information</CardTitle>
                  <CardDescription className="text-[10px] sm:text-xs md:text-sm">Your personal contact details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3 md:space-y-4 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
                  {isEditing ? (
                    <>
                      <div>
                        <Label htmlFor="phone" className="text-[11px] sm:text-xs md:text-sm">Phone Number</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="+234 XXX XXX XXXX"
                          className="h-8 sm:h-9 md:h-10 text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="address" className="text-[11px] sm:text-xs md:text-sm">Address</Label>
                        <Textarea
                          id="address"
                          value={formData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          placeholder="Your address"
                          rows={2}
                          className="resize-none text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="bio" className="text-[11px] sm:text-xs md:text-sm">Bio</Label>
                        <Textarea
                          id="bio"
                          value={formData.bio}
                          onChange={(e) => handleInputChange('bio', e.target.value)}
                          placeholder="Tell us about yourself..."
                          rows={3}
                          className="resize-none text-xs sm:text-sm"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2 sm:space-y-3">
                      <InfoCard icon={Phone} label="Phone" value={formData.phone || 'Not provided'} />
                      <InfoCard icon={MapPin} label="Address" value={formData.address || 'Not provided'} />
                      {formData.bio && <InfoCard icon={User} label="Bio" value={formData.bio} />}
                      {!formData.bio && !formData.phone && !formData.address && (
                        <p className="text-center text-[11px] sm:text-xs text-muted-foreground py-4">
                          No personal information added yet. Click Edit Profile to add.
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Professional Information */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-4 md:px-6">
                  <CardTitle className="text-sm sm:text-base md:text-lg">Professional Information</CardTitle>
                  <CardDescription className="text-[10px] sm:text-xs md:text-sm">Your teaching qualifications and experience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3 md:space-y-4 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
                  {isEditing ? (
                    <>
                      <div>
                        <Label htmlFor="qualification" className="text-[11px] sm:text-xs md:text-sm">Highest Qualification</Label>
                        <Input
                          id="qualification"
                          value={formData.qualification}
                          onChange={(e) => handleInputChange('qualification', e.target.value)}
                          placeholder="e.g., M.Ed., B.Sc."
                          className="h-8 sm:h-9 md:h-10 text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="experience" className="text-[11px] sm:text-xs md:text-sm">Years of Experience</Label>
                        <Input
                          id="experience"
                          value={formData.experience}
                          onChange={(e) => handleInputChange('experience', e.target.value)}
                          placeholder="e.g., 5 years"
                          className="h-8 sm:h-9 md:h-10 text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="subjects" className="text-[11px] sm:text-xs md:text-sm">Subjects Taught</Label>
                        <Input
                          id="subjects"
                          value={formData.subjects}
                          onChange={(e) => handleInputChange('subjects', e.target.value)}
                          placeholder="e.g., Mathematics, Physics"
                          className="h-8 sm:h-9 md:h-10 text-xs sm:text-sm"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2 sm:space-y-3">
                      <InfoCard icon={Award} label="Qualification" value={formData.qualification || 'Not provided'} />
                      <InfoCard icon={Clock} label="Experience" value={formData.experience || 'Not provided'} />
                      <InfoCard icon={BookOpen} label="Subjects" value={formData.subjects || 'Not provided'} />
                      <InfoCard icon={Building} label="Department" value={formData.department || 'Not assigned'} />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* VIN ID Card */}
            <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-50 to-blue-50">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-blue-100 rounded-xl shrink-0">
                    <Hash className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] sm:text-xs md:text-sm text-slate-500">Staff VIN ID</p>
                    <p className="text-sm sm:text-base md:text-lg font-mono font-bold text-slate-900 break-all">
                      {formData.vin_id || 'Not assigned'}
                    </p>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5">
                      This is your unique staff identification number
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============================================ */}
          {/* SECURITY TAB */}
          {/* ============================================ */}
          <TabsContent value="security" className="space-y-3 sm:space-y-4 md:space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-4 md:px-6">
                <CardTitle className="text-sm sm:text-base md:text-lg">Account Security</CardTitle>
                <CardDescription className="text-[10px] sm:text-xs md:text-sm">View your account details and security information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 md:space-y-6 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
                {/* Email Info */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-slate-50 rounded-xl">
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] sm:text-xs md:text-sm text-slate-500">Email Address</p>
                    <p className="font-medium text-sm sm:text-base break-all">{formData.email}</p>
                  </div>
                  <Badge variant="outline" className="gap-1 shrink-0 text-[10px] sm:text-xs">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    Verified
                  </Badge>
                </div>

                {/* VIN ID Section */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <Hash className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] sm:text-xs md:text-sm text-blue-600">Staff VIN ID</p>
                    <p className="font-mono font-bold text-sm sm:text-base text-blue-900 break-all">
                      {formData.vin_id || 'Not assigned'}
                    </p>
                    <p className="text-[9px] sm:text-[10px] text-blue-500 mt-0.5">
                      Your unique identification number cannot be changed
                    </p>
                  </div>
                  <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 shrink-0" />
                </div>

                {/* Password Section - Read Only */}
                <div className="p-3 sm:p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 shrink-0" />
                    <div>
                      <p className="font-medium text-amber-800 text-sm sm:text-base">Password</p>
                      <p className="text-[10px] sm:text-xs md:text-sm text-amber-600">Password changes are managed by the system administrator</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 sm:p-3 bg-amber-100/50 rounded-lg">
                    <Key className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500" />
                    <p className="text-[11px] sm:text-xs text-amber-700">
                      Contact your administrator to request a password change
                    </p>
                  </div>
                </div>

                {/* Account Status */}
                <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-green-50 rounded-xl border border-green-200">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 shrink-0" />
                  <div>
                    <p className="font-medium text-green-800 text-sm sm:text-base">Account Status</p>
                    <p className="text-[10px] sm:text-xs md:text-sm text-green-600">Your account is active and secure</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}