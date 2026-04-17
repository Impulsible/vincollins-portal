/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
// app/student/profile/page.tsx - WORKING UPLOAD
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { StudentSidebar } from '@/components/student/StudentSidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  User, Mail, Phone, MapPin, Calendar, GraduationCap, Shield,
  Camera, Loader2, Save, ChevronRight, Home, ArrowLeft,
  CheckCircle2, AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface StudentProfile {
  id: string
  full_name: string
  email: string
  vin_id: string
  class: string
  department: string
  phone: string
  address: string
  admission_year: number
  photo_url: string | null
  avatar_url?: string | null
  is_active: boolean
  created_at: string
  bio?: string
}

export default function StudentProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  
  useEffect(() => {
    const storedTab = sessionStorage.getItem('studentActiveTab')
    if (storedTab) {
      setActiveTab(storedTab)
      sessionStorage.removeItem('studentActiveTab')
    }
  }, [])
  
  const handleSidebarTabChange = (tab: string) => {
    setActiveTab(tab)
    switch (tab) {
      case 'overview': router.push('/student'); break
      case 'exams': router.push('/student/exams'); break
      case 'results': router.push('/student/results'); break
      case 'assignments': router.push('/student/assignments'); break
      case 'courses': router.push('/student/courses'); break
      case 'report-card': router.push('/student/report-card'); break
      case 'performance': router.push('/student/performance'); break
      case 'profile': break
      case 'settings': router.push('/student/settings'); break
      case 'notifications': router.push('/student/notifications'); break
      case 'help': router.push('/student/help'); break
      default: router.push('/student')
    }
  }
  
  const [isUploading, setIsUploading] = useState(false)
  const [avatarKey, setAvatarKey] = useState(Date.now())
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: '',
    address: '',
    bio: ''
  })

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/portal')
        return
      }

      console.log('📸 Loading profile for user:', session.user.id)

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()

      if (profileError) {
        console.error('Error loading profile:', profileError)
        toast.error('Failed to load profile')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('vin_id')
        .eq('id', session.user.id)
        .maybeSingle()

      console.log('📸 Current photo_url:', profileData?.photo_url)

      if (profileData) {
        const fullProfile: StudentProfile = {
          ...profileData,
          vin_id: userData?.vin_id || profileData.vin_id || 'N/A'
        }
        setProfile(fullProfile)
        setEditForm({
          full_name: profileData.full_name || '',
          phone: profileData.phone || '',
          address: profileData.address || '',
          bio: profileData.bio || ''
        })
      } else {
        const emailName = session.user.email?.split('@')[0] || 'Student'
        const formattedName = emailName.split('.').map((n: string) => 
          n.charAt(0).toUpperCase() + n.slice(1)
        ).join(' ')
        
        const newProfile = {
          id: session.user.id,
          full_name: formattedName,
          email: session.user.email || '',
          vin_id: userData?.vin_id || 'N/A',
          class: 'Not Assigned',
          department: 'General',
          phone: '',
          address: '',
          admission_year: new Date().getFullYear(),
          photo_url: null,
          is_active: true,
          created_at: new Date().toISOString()
        }
        setProfile(newProfile)
        setEditForm({
          full_name: newProfile.full_name,
          phone: '',
          address: '',
          bio: ''
        })
        
        await supabase.from('profiles').upsert({
          id: session.user.id,
          full_name: formattedName,
          email: session.user.email,
          role: 'student',
          class: 'Not Assigned',
          department: 'General',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  // FIXED: Simple, working upload function
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB')
      return
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    setIsUploading(true)
    
    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      
      console.log('📸 Uploading file:', fileName)

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('student-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw uploadError
      }

      console.log('📸 Upload successful:', data)

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('student-photos')
        .getPublicUrl(fileName)

      const publicUrl = urlData.publicUrl
      console.log('📸 Public URL:', publicUrl)

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
      setProfile(prev => prev ? { ...prev, photo_url: publicUrl, avatar_url: publicUrl } : null)
      setAvatarKey(Date.now()) // Force avatar refresh
      
      toast.success('Profile photo updated successfully!')
      
      // Reload profile to ensure sync
      setTimeout(() => loadProfile(), 500)
      
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Failed to upload photo')
    } finally {
      setIsUploading(false)
      // Clear the input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleSaveProfile = async () => {
    if (!profile) return
    
    setSaving(true)
    try {
      const updates = {
        full_name: editForm.full_name,
        phone: editForm.phone,
        address: editForm.address,
        bio: editForm.bio,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id)

      if (error) throw error

      setProfile({
        ...profile,
        ...updates
      })
      
      setIsEditing(false)
      toast.success('Profile updated successfully!')
      
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/portal')
  }

  const getInitials = () => {
    if (!profile?.full_name) return 'S'
    const name = profile.full_name.trim()
    const parts = name.split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  const formatProfileForHeader = () => {
    if (!profile) return undefined
    return {
      id: profile.id,
      name: profile.full_name,
      email: profile.email,
      role: 'student' as const,
      avatar: profile.photo_url || undefined,
      isAuthenticated: true
    }
  }

  if (loading) {
    return (
      <>
        <Header onLogout={handleLogout} />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pt-20">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-3xl mx-auto space-y-6">
              <Skeleton className="h-48 w-full rounded-2xl" />
              <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col">
      <Header user={formatProfileForHeader()} onLogout={handleLogout} />
      
      <div className="flex flex-1">
        <StudentSidebar 
          profile={profile}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeTab={activeTab}
          setActiveTab={handleSidebarTabChange}
        />

        <div className={cn(
          "flex-1 transition-all duration-300",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
        )}>
          <main className="pt-20 lg:pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="container mx-auto max-w-4xl">
              
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 flex items-center justify-between"
              >
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Link href="/student" className="hover:text-primary flex items-center gap-1">
                    <Home className="h-3.5 w-3.5" />
                    Dashboard
                  </Link>
                  <ChevronRight className="h-3.5 w-3.5" />
                  <span className="text-foreground font-medium">My Profile</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => router.push('/student')}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Button>
              </motion.div>

              <div className="space-y-6">
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="border-0 shadow-lg overflow-hidden">
                    <div className="relative h-36 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600">
                      <div className="absolute inset-0 bg-black/10" />
                      
                      {!isEditing && (
                        <div className="absolute top-4 right-4">
                          <Button 
                            onClick={() => setIsEditing(true)} 
                            size="sm"
                            className="bg-white/90 text-emerald-700 hover:bg-white shadow-md"
                          >
                            <User className="mr-2 h-4 w-4" />
                            Edit Profile
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    <div className="px-6 sm:px-8">
                      <div className="relative -mt-16 mb-4">
                        <div className="relative inline-block">
                          <Avatar className="h-28 w-28 sm:h-32 sm:w-32 ring-4 ring-white shadow-xl" key={avatarKey}>
                            <AvatarImage 
                              src={profile?.photo_url || undefined} 
                              alt={profile?.full_name}
                            />
                            <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white text-2xl sm:text-3xl font-bold">
                              {getInitials()}
                            </AvatarFallback>
                          </Avatar>
                          
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute -bottom-1 -right-1 p-2.5 rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 transition-colors"
                            disabled={isUploading}
                          >
                            {isUploading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Camera className="h-4 w-4" />
                            )}
                          </button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            onChange={handleImageSelect}
                            className="hidden"
                          />
                        </div>
                        
                        {isUploading && (
                          <p className="text-xs text-muted-foreground mt-2">Uploading photo...</p>
                        )}
                      </div>
                    </div>
                    
                    <CardContent className="px-6 sm:px-8 pb-6">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="space-y-1">
                          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                            {profile?.full_name}
                          </h1>
                          <p className="text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5" />
                            {profile?.email}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 pt-2">
                            <Badge className="bg-emerald-100 text-emerald-700">
                              <GraduationCap className="mr-1 h-3.5 w-3.5" />
                              {profile?.class}
                            </Badge>
                            <Badge variant="outline" className="font-mono">
                              <Shield className="mr-1 h-3.5 w-3.5" />
                              VIN: {profile?.vin_id}
                            </Badge>
                          </div>
                        </div>
                        
                        {isEditing && (
                          <div className="flex gap-2 sm:self-center">
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setIsEditing(false)
                                setEditForm({
                                  full_name: profile?.full_name || '',
                                  phone: profile?.phone || '',
                                  address: profile?.address || '',
                                  bio: profile?.bio || ''
                                })
                              }}
                            >
                              Cancel
                            </Button>
                            <Button 
                              onClick={handleSaveProfile} 
                              disabled={saving}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              {saving ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="mr-2 h-4 w-4" />
                              )}
                              Save Changes
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl">Personal Information</CardTitle>
                      <CardDescription>
                        Your personal details and contact information
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="px-6 sm:px-8 pb-8">
                      {isEditing ? (
                        <div className="space-y-5">
                          <div className="space-y-2">
                            <Label htmlFor="full_name">Full Name</Label>
                            <Input
                              id="full_name"
                              value={editForm.full_name}
                              onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                              placeholder="Your full name"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                              id="phone"
                              type="tel"
                              value={editForm.phone}
                              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                              placeholder="+234 XXX XXX XXXX"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Textarea
                              id="address"
                              value={editForm.address}
                              onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                              placeholder="Your residential address"
                              rows={2}
                              className="resize-none"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="bio">Bio (Optional)</Label>
                            <Textarea
                              id="bio"
                              value={editForm.bio}
                              onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                              placeholder="Tell us a little about yourself..."
                              rows={3}
                              className="resize-none"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InfoCard icon={User} label="Full Name" value={profile?.full_name || '-'} />
                            <InfoCard icon={Mail} label="Email Address" value={profile?.email || '-'} />
                            <InfoCard icon={Phone} label="Phone Number" value={profile?.phone || 'Not provided'} />
                            <InfoCard icon={Calendar} label="Admission Year" value={profile?.admission_year?.toString() || '-'} />
                          </div>
                          
                          <Separator className="my-4" />
                          
                          <InfoCard icon={MapPin} label="Address" value={profile?.address || 'No address added yet.'} fullWidth />
                          
                          {profile?.bio && (
                            <>
                              <Separator className="my-4" />
                              <InfoCard icon={User} label="Bio" value={profile.bio} fullWidth />
                            </>
                          )}
                          
                          <Separator className="my-4" />
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InfoCard icon={Shield} label="VIN ID (Permanent)" value={profile?.vin_id || '-'} monospace />
                            <InfoCard icon={Calendar} label="Member Since" value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'} />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

function InfoCard({ 
  icon: Icon, 
  label, 
  value, 
  fullWidth = false,
  monospace = false
}: { 
  icon: React.ElementType
  label: string
  value: string
  fullWidth?: boolean
  monospace?: boolean
}) {
  return (
    <div className={cn(
      "flex items-start gap-3 p-4 rounded-xl bg-slate-50",
      fullWidth && "col-span-full"
    )}>
      <div className="p-2 bg-white rounded-lg shrink-0">
        <Icon className="h-4 w-4 text-emerald-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className={cn(
          "font-medium text-slate-900 break-words",
          monospace && "font-mono text-sm"
        )}>
          {value}
        </p>
      </div>
    </div>
  )
}