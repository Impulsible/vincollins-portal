/* eslint-disable @typescript-eslint/no-unused-vars */
// app/staff/profile/page.tsx - FULLY RESPONSIVE + PHOTO UPLOAD + DARK MODE
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
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { 
  User, Mail, Phone, MapPin, BookOpen, Award, 
  Camera, Save, X, Building, Clock, Shield, Key,
  CheckCircle, Loader2, Hash, Lock
} from 'lucide-react'

// ============================================
// TYPES
// ============================================
interface StaffProfile {
  id: string
  full_name: string | null
  email: string | null
  phone?: string | null
  address?: string | null
  department?: string | null
  position?: string | null
  qualification?: string | null
  experience?: string | null
  bio?: string | null
  subjects?: string | null
  photo_url?: string | null
  avatar_url?: string | null
  vin_id?: string | null
  role?: string | null
  created_at?: string | null
  updated_at?: string | null
}

// ============================================
// HELPER COMPONENTS
// ============================================
function InfoCard({ icon: Icon, label, value, className }: { 
  icon: React.ElementType
  label: string
  value: string
  className?: string 
}) {
  return (
    <div className={cn(
      "flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl",
      className
    )}>
      <div className="p-1.5 sm:p-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-lg shrink-0 shadow-sm">
        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-0.5">{label}</p>
        <p className="font-medium text-slate-900 dark:text-slate-100 text-xs sm:text-sm break-words">
          {value || 'Not provided'}
        </p>
      </div>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <Skeleton className="h-32 sm:h-40 w-full rounded-2xl bg-slate-200 dark:bg-slate-800" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <Skeleton className="h-64 sm:h-80 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <Skeleton className="h-64 sm:h-80 rounded-2xl bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function StaffProfilePage() {
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<StaffProfile | null>(null)
  const [activeTab, setActiveTab] = useState('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [avatarKey, setAvatarKey] = useState(Date.now())
  const [avatarError, setAvatarError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
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

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true)
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Session error:', sessionError)
        toast.error('Authentication error. Please login again.')
        router.push('/portal')
        return
      }
      
      if (!session) {
        toast.error('Please login to view your profile')
        router.push('/portal')
        return
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          const vinId = `VIN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`
          
          const newProfile = {
            id: session.user.id,
            email: session.user.email || '',
            full_name: session.user.user_metadata?.full_name || '',
            department: session.user.user_metadata?.department || '',
            position: session.user.user_metadata?.position || 'Teacher',
            role: 'staff',
            vin_id: vinId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
          
          const { data: insertedData, error: insertError } = await supabase
            .from('profiles')
            .insert([newProfile])
            .select()
            .single()

          if (insertError) {
            console.error('Error creating profile:', insertError)
            toast.error('Failed to create profile')
            setLoading(false)
            return
          }

          setProfile(insertedData as StaffProfile)
          setFormData({
            full_name: insertedData.full_name || '',
            email: insertedData.email || session.user.email || '',
            phone: insertedData.phone || '',
            address: insertedData.address || '',
            department: insertedData.department || '',
            position: insertedData.position || '',
            qualification: insertedData.qualification || '',
            experience: insertedData.experience || '',
            bio: insertedData.bio || '',
            subjects: insertedData.subjects || '',
            photo_url: insertedData.photo_url || insertedData.avatar_url || '',
            vin_id: insertedData.vin_id || vinId,
          })
          
          toast.success('Profile created successfully!')
        } else {
          console.error('Error fetching profile:', profileError)
          toast.error('Failed to load profile data')
        }
        setLoading(false)
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
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      toast.error('An unexpected error occurred while loading your profile')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload an image file (JPEG, PNG, GIF, or WebP)')
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
        try {
          const urlParts = profile.photo_url.split('/')
          const oldPath = urlParts[urlParts.length - 1]
          if (oldPath) {
            await supabase.storage
              .from('student-photos')
              .remove([oldPath])
          }
        } catch (deleteError) {
          console.warn('Could not delete old photo:', deleteError)
        }
      }

      const fileExt = file.name.split('.').pop() || 'jpg'
      const fileName = `staff-${profile?.id || 'unknown'}-${Date.now()}.${fileExt}`
      
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
      setAvatarError(false)
      
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

  const handleSave = async () => {
    if (!formData.full_name?.trim()) {
      toast.error('Full name is required')
      return
    }

    setSaving(true)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Session expired. Please login again.')
        router.push('/portal')
        return
      }

      const updateData = {
        id: session.user.id,
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone?.trim() || null,
        address: formData.address?.trim() || null,
        department: formData.department?.trim() || 'General',
        position: formData.position?.trim() || 'Teacher',
        qualification: formData.qualification?.trim() || null,
        experience: formData.experience?.trim() || null,
        bio: formData.bio?.trim() || null,
        subjects: formData.subjects?.trim() || null,
        photo_url: formData.photo_url || null,
        avatar_url: formData.photo_url || null,
        role: profile?.role || 'staff',
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('profiles')
        .upsert(updateData, { onConflict: 'id' })

      if (error) {
        console.error('Database error:', error)
        throw new Error(error.message || 'Failed to save profile')
      }

      const { data: refreshedData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (refreshedData) {
        setProfile(refreshedData as StaffProfile)
      } else {
        setProfile(prev => prev ? { ...prev, ...updateData } : null)
      }

      toast.success('Profile updated successfully!')
      setIsEditing(false)
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast.error(error.message || 'Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
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
        photo_url: profile.photo_url || profile.avatar_url || '',
        vin_id: profile.vin_id || '',
      })
    }
    setIsEditing(false)
    setAvatarError(false)
  }

  if (loading) {
    return (
      <div className="px-3 sm:px-4 md:px-5 lg:px-6 py-4 sm:py-5 md:py-6 transition-colors duration-300">
        <ProfileSkeleton />
      </div>
    )
  }

  return (
    <div className="px-3 sm:px-4 md:px-5 lg:px-6 py-4 sm:py-5 md:py-6 transition-colors duration-300">
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 sm:space-y-5 md:space-y-6"
      >
        {/* Page Title */}
        <div className="mb-3 sm:mb-4">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
            {isEditing ? 'Edit Profile' : 'My Profile'}
          </h1>
          <p className="text-[11px] sm:text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {isEditing ? 'Update your personal and professional information' : 'View and manage your profile information'}
          </p>
        </div>

        {/* Profile Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3 sm:space-y-4 md:space-y-6">
          <TabsList className="grid w-full max-w-[240px] sm:max-w-[280px] md:max-w-md grid-cols-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <TabsTrigger 
              value="profile" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 rounded-lg text-[11px] sm:text-xs md:text-sm py-1.5 sm:py-2 text-slate-600 dark:text-slate-400 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white"
            >
              <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-1 sm:mr-1.5" />
              Profile
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 rounded-lg text-[11px] sm:text-xs md:text-sm py-1.5 sm:py-2 text-slate-600 dark:text-slate-400 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white"
            >
              <Shield className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-1 sm:mr-1.5" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* PROFILE TAB */}
          <TabsContent value="profile" className="space-y-3 sm:space-y-4 md:space-y-6">
            {/* Profile Card with Avatar */}
            <Card className="border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden bg-white dark:bg-slate-900">
              <div className="relative h-20 sm:h-24 md:h-28 lg:h-32 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 dark:from-blue-800 dark:via-blue-700 dark:to-indigo-800">
                {!isEditing && (
                  <div className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4">
                    <Button 
                      onClick={() => setIsEditing(true)} 
                      size="sm"
                      className="bg-white/90 dark:bg-slate-900/90 text-blue-700 dark:text-blue-400 hover:bg-white dark:hover:bg-slate-900 shadow-md h-7 sm:h-8 text-[11px] sm:text-xs"
                    >
                      <User className="mr-1 sm:mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      Edit Profile
                    </Button>
                  </div>
                )}
              </div>
              
              <CardContent className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-end gap-3 sm:gap-4 md:gap-6">
                  {/* Avatar */}
                  <div className="relative -mt-10 sm:-mt-12 md:-mt-16">
                    <div className="relative">
                      <Avatar 
                        className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 lg:h-28 lg:w-28 ring-4 ring-white dark:ring-slate-900 shadow-xl" 
                        key={avatarKey}
                      >
                        <AvatarImage 
                          src={formData.photo_url || undefined} 
                          alt={formData.full_name}
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
                          className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 p-1.5 sm:p-2 md:p-2.5 bg-blue-600 dark:bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 dark:hover:bg-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                      aria-label="Upload profile photo"
                    />
                    
                    {isUploading && (
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 sm:mt-2 text-center">
                        Uploading...
                      </p>
                    )}
                    {isEditing && !isUploading && (
                      <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 mt-1 text-center max-w-[80px] sm:max-w-[100px]">
                        Click to upload photo
                      </p>
                    )}
                  </div>

                  {/* Basic Info */}
                  <div className="flex-1 text-center sm:text-left pb-2 sm:pb-3 md:pb-4 min-w-0">
                    {isEditing ? (
                      <div className="space-y-2 sm:space-y-3">
                        <div>
                          <Label htmlFor="full_name" className="text-[11px] sm:text-xs md:text-sm text-slate-700 dark:text-slate-300">
                            Full Name <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="full_name"
                            value={formData.full_name}
                            onChange={(e) => handleInputChange('full_name', e.target.value)}
                            placeholder="Enter your full name"
                            className="h-8 sm:h-9 md:h-10 text-xs sm:text-sm bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                          <div>
                            <Label htmlFor="position" className="text-[11px] sm:text-xs md:text-sm text-slate-700 dark:text-slate-300">Position</Label>
                            <Input
                              id="position"
                              value={formData.position}
                              onChange={(e) => handleInputChange('position', e.target.value)}
                              placeholder="e.g., Senior Teacher"
                              className="h-8 sm:h-9 md:h-10 text-xs sm:text-sm bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            />
                          </div>
                          <div>
                            <Label htmlFor="department" className="text-[11px] sm:text-xs md:text-sm text-slate-700 dark:text-slate-300">Department</Label>
                            <Select value={formData.department} onValueChange={(value) => handleInputChange('department', value)}>
                              <SelectTrigger className="h-8 sm:h-9 md:h-10 text-xs sm:text-sm bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                                <SelectValue placeholder="Select department" />
                              </SelectTrigger>
                              <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
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
                        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white truncate">
                          {formData.full_name || 'Not set'}
                        </h2>
                        <div className="flex flex-wrap justify-center sm:justify-start gap-1 sm:gap-1.5 md:gap-2 mt-1 sm:mt-1.5 md:mt-2">
                          <Badge className="bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 text-[10px] sm:text-xs border-0">
                            {formData.position || 'Position not set'}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] sm:text-xs border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                            {formData.department || 'Department not set'}
                          </Badge>
                          {formData.qualification && (
                            <Badge className="text-[10px] sm:text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-0">
                              {formData.qualification}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1 sm:mt-1.5 md:mt-2 text-[11px] sm:text-xs md:text-sm text-slate-500 dark:text-slate-400">
                          <div className="flex items-center justify-center sm:justify-start gap-1">
                            <Mail className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 flex-shrink-0" />
                            <span className="truncate">{formData.email || 'No email'}</span>
                          </div>
                          {formData.vin_id && (
                            <>
                              <span className="hidden sm:inline text-slate-300 dark:text-slate-600">-</span>
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

                  {/* Desktop Save Buttons */}
                  {isEditing && (
                    <div className="hidden sm:flex gap-2 self-end pb-2 sm:pb-3 md:pb-4 flex-shrink-0">
                      <Button 
                        variant="outline" 
                        onClick={handleCancel} 
                        className="h-8 sm:h-9 text-[11px] sm:text-xs border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <X className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5" />
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleSave} 
                        disabled={saving} 
                        className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 h-8 sm:h-9 text-[11px] sm:text-xs"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin mr-1 sm:mr-1.5" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Mobile Save Buttons */}
                {isEditing && (
                  <div className="flex sm:hidden gap-2 mt-3 justify-end">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleCancel} 
                      className="h-8 text-[11px] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={handleSave} 
                      disabled={saving} 
                      className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 h-8 text-[11px]"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-3 w-3 mr-1" />
                          Save
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Detailed Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              {/* Personal Information */}
              <Card className="border border-slate-200 dark:border-slate-800 shadow-lg bg-white dark:bg-slate-900">
                <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-4 md:px-6">
                  <CardTitle className="text-sm sm:text-base md:text-lg text-slate-800 dark:text-white">Personal Information</CardTitle>
                  <CardDescription className="text-[10px] sm:text-xs md:text-sm text-slate-500 dark:text-slate-400">
                    Your personal contact details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3 md:space-y-4 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
                  {isEditing ? (
                    <>
                      <div>
                        <Label htmlFor="phone" className="text-[11px] sm:text-xs md:text-sm text-slate-700 dark:text-slate-300">Phone Number</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="+234 XXX XXX XXXX"
                          className="h-8 sm:h-9 md:h-10 text-xs sm:text-sm bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        />
                      </div>
                      <div>
                        <Label htmlFor="address" className="text-[11px] sm:text-xs md:text-sm text-slate-700 dark:text-slate-300">Address</Label>
                        <Textarea
                          id="address"
                          value={formData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          placeholder="Your address"
                          rows={2}
                          className="resize-none text-xs sm:text-sm bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        />
                      </div>
                      <div>
                        <Label htmlFor="bio" className="text-[11px] sm:text-xs md:text-sm text-slate-700 dark:text-slate-300">Bio</Label>
                        <Textarea
                          id="bio"
                          value={formData.bio}
                          onChange={(e) => handleInputChange('bio', e.target.value)}
                          placeholder="Tell us about yourself..."
                          rows={3}
                          className="resize-none text-xs sm:text-sm bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2 sm:space-y-3">
                      <InfoCard icon={Phone} label="Phone" value={formData.phone || ''} />
                      <InfoCard icon={MapPin} label="Address" value={formData.address || ''} />
                      <InfoCard icon={User} label="Bio" value={formData.bio || ''} />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Professional Information */}
              <Card className="border border-slate-200 dark:border-slate-800 shadow-lg bg-white dark:bg-slate-900">
                <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-4 md:px-6">
                  <CardTitle className="text-sm sm:text-base md:text-lg text-slate-800 dark:text-white">Professional Information</CardTitle>
                  <CardDescription className="text-[10px] sm:text-xs md:text-sm text-slate-500 dark:text-slate-400">
                    Your teaching qualifications and experience
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3 md:space-y-4 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
                  {isEditing ? (
                    <>
                      <div>
                        <Label htmlFor="qualification" className="text-[11px] sm:text-xs md:text-sm text-slate-700 dark:text-slate-300">Highest Qualification</Label>
                        <Input
                          id="qualification"
                          value={formData.qualification}
                          onChange={(e) => handleInputChange('qualification', e.target.value)}
                          placeholder="e.g., M.Ed., B.Sc."
                          className="h-8 sm:h-9 md:h-10 text-xs sm:text-sm bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        />
                      </div>
                      <div>
                        <Label htmlFor="experience" className="text-[11px] sm:text-xs md:text-sm text-slate-700 dark:text-slate-300">Years of Experience</Label>
                        <Input
                          id="experience"
                          value={formData.experience}
                          onChange={(e) => handleInputChange('experience', e.target.value)}
                          placeholder="e.g., 5 years"
                          className="h-8 sm:h-9 md:h-10 text-xs sm:text-sm bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        />
                      </div>
                      <div>
                        <Label htmlFor="subjects" className="text-[11px] sm:text-xs md:text-sm text-slate-700 dark:text-slate-300">Subjects Taught</Label>
                        <Input
                          id="subjects"
                          value={formData.subjects}
                          onChange={(e) => handleInputChange('subjects', e.target.value)}
                          placeholder="e.g., Mathematics, Physics"
                          className="h-8 sm:h-9 md:h-10 text-xs sm:text-sm bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2 sm:space-y-3">
                      <InfoCard icon={Award} label="Qualification" value={formData.qualification || ''} />
                      <InfoCard icon={Clock} label="Experience" value={formData.experience || ''} />
                      <InfoCard icon={BookOpen} label="Subjects" value={formData.subjects || ''} />
                      <InfoCard icon={Building} label="Department" value={formData.department || ''} />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* VIN ID Card */}
            {formData.vin_id && (
              <Card className="border border-slate-200 dark:border-slate-800 shadow-lg bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
                <CardContent className="p-3 sm:p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-950/50 rounded-xl shrink-0">
                      <Hash className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] sm:text-xs md:text-sm text-slate-500 dark:text-slate-400">Staff VIN ID</p>
                      <p className="text-sm sm:text-base md:text-lg font-mono font-bold text-slate-900 dark:text-white break-all">
                        {formData.vin_id}
                      </p>
                      <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                        This is your unique staff identification number
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* SECURITY TAB */}
          <TabsContent value="security" className="space-y-3 sm:space-y-4 md:space-y-6">
            <Card className="border border-slate-200 dark:border-slate-800 shadow-lg bg-white dark:bg-slate-900">
              <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-4 md:px-6">
                <CardTitle className="text-sm sm:text-base md:text-lg text-slate-800 dark:text-white">Account Security</CardTitle>
                <CardDescription className="text-[10px] sm:text-xs md:text-sm text-slate-500 dark:text-slate-400">
                  View your account details and security information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 md:space-y-6 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
                {/* Email Info */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl">
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] sm:text-xs md:text-sm text-slate-500 dark:text-slate-400">Email Address</p>
                    <p className="font-medium text-sm sm:text-base break-all text-slate-800 dark:text-slate-100">{formData.email}</p>
                  </div>
                  <Badge variant="outline" className="gap-1 shrink-0 text-[10px] sm:text-xs border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                    <CheckCircle className="h-3 w-3 text-green-500 dark:text-green-400" />
                    Verified
                  </Badge>
                </div>

                {/* VIN ID Section */}
                {formData.vin_id && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/50">
                    <Hash className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] sm:text-xs md:text-sm text-blue-600 dark:text-blue-400">Staff VIN ID</p>
                      <p className="font-mono font-bold text-sm sm:text-base text-blue-900 dark:text-blue-200 break-all">
                        {formData.vin_id}
                      </p>
                      <p className="text-[9px] sm:text-[10px] text-blue-500 dark:text-blue-400 mt-0.5">
                        Your unique identification number cannot be changed
                      </p>
                    </div>
                    <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 dark:text-blue-500 shrink-0" />
                  </div>
                )}

                {/* Account Created */}
                {profile?.created_at && (
                  <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600 dark:text-slate-400 shrink-0" />
                    <div>
                      <p className="text-[11px] sm:text-xs md:text-sm text-slate-500 dark:text-slate-400">Account Created</p>
                      <p className="font-medium text-sm sm:text-base text-slate-900 dark:text-slate-100">
                        {new Date(profile.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {/* Password Section */}
                <div className="p-3 sm:p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/50">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <div>
                      <p className="font-medium text-amber-800 dark:text-amber-300 text-sm sm:text-base">Password</p>
                      <p className="text-[10px] sm:text-xs md:text-sm text-amber-600 dark:text-amber-400">
                        Password changes are managed by the system administrator
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 sm:p-3 bg-amber-100/50 dark:bg-amber-900/30 rounded-lg">
                    <Key className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500 dark:text-amber-400" />
                    <p className="text-[11px] sm:text-xs text-amber-700 dark:text-amber-300">
                      Contact your administrator to request a password change
                    </p>
                  </div>
                </div>

                {/* Account Status */}
                <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-900/50">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400 shrink-0" />
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-300 text-sm sm:text-base">Account Status</p>
                    <p className="text-[10px] sm:text-xs md:text-sm text-green-600 dark:text-green-400">
                      Your account is active and secure
                    </p>
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