/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
// app/student/profile/page.tsx - FULLY FIXED WITH SIDEBAR SYNC
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
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  Shield,
  Camera,
  Loader2,
  Save,
  ChevronRight,
  Home,
  ArrowLeft
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
  
  // ✅ Read stored tab from sessionStorage when coming from sub-route
  useEffect(() => {
    const storedTab = sessionStorage.getItem('studentActiveTab')
    if (storedTab) {
      setActiveTab(storedTab)
      sessionStorage.removeItem('studentActiveTab')
    }
  }, [])
  
  // ✅ Handle sidebar navigation - sync with main dashboard
  const handleSidebarTabChange = (tab: string) => {
    setActiveTab(tab)
    
    // Navigate to the corresponding route
    switch (tab) {
      case 'overview':
        router.push('/student')
        break
      case 'exams':
        router.push('/student/exams')
        break
      case 'results':
        router.push('/student/results')
        break
      case 'assignments':
        router.push('/student/assignments')
        break
      case 'attendance':
        router.push('/student/attendance')
        break
      case 'courses':
        router.push('/student/courses')
        break
      case 'performance':
        router.push('/student/performance')
        break
      case 'profile':
        // Already on profile page
        break
      case 'settings':
        router.push('/student/settings')
        break
      case 'notifications':
        router.push('/student/notifications')
        break
      case 'help':
        router.push('/student/help')
        break
      default:
        router.push('/student')
    }
  }
  
  // Image upload states
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Edit mode
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

      // Get user data
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .or(`auth_id.eq.${session.user.id},id.eq.${session.user.id}`)
        .maybeSingle()

      if (!userData) {
        toast.error('Account not found')
        router.push('/portal')
        return
      }

      // Get profile data
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userData.id)
        .maybeSingle()

      if (profileData) {
        setProfile({
          ...profileData,
          vin_id: userData.vin_id
        })
        setEditForm({
          full_name: profileData.full_name || '',
          phone: profileData.phone || '',
          address: profileData.address || '',
          bio: profileData.bio || ''
        })
        setImagePreview(profileData.photo_url)
      } else {
        // Create basic profile from user data
        const emailName = userData.email?.split('@')[0] || 'Student'
        const formattedName = emailName.split('.').map((n: string) => 
          n.charAt(0).toUpperCase() + n.slice(1)
        ).join(' ')
        
        const newProfile = {
          id: userData.id,
          full_name: formattedName,
          email: userData.email,
          vin_id: userData.vin_id,
          class: 'Not Assigned',
          department: '',
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
        
        // Create profile record in database
        await supabase.from('profiles').upsert({
          id: userData.id,
          full_name: formattedName,
          email: userData.email,
          role: 'student',
          class: 'Not Assigned',
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

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB')
        return
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      
      // Auto-upload when image is selected
      handleUploadImage(file)
    }
  }

  // Upload image to Supabase Storage
  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${profile?.id}-${Date.now()}.${fileExt}`
      const filePath = `student-photos/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('student-photos')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('student-photos')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      return null
    }
  }

  const handleUploadImage = async (file: File) => {
    if (!profile) return
    
    setIsUploading(true)
    try {
      const photoUrl = await uploadImage(file)
      if (photoUrl) {
        // Update profile with new photo URL
        const { error } = await supabase
          .from('profiles')
          .update({ 
            photo_url: photoUrl, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', profile.id)

        if (error) throw error

        setProfile({ ...profile, photo_url: photoUrl })
        setImagePreview(photoUrl)
        toast.success('Profile photo updated!')
        
        setSelectedImage(null)
      }
    } catch (error) {
      console.error('Error uploading photo:', error)
      toast.error('Failed to upload photo')
    } finally {
      setIsUploading(false)
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
      toast.success('Profile updated!')
      
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

  const handleBackToDashboard = () => {
    router.push('/student')
  }

  const getInitials = () => {
    if (!profile?.full_name) return 'S'
    return profile.full_name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <>
        <Header onLogout={handleLogout} />
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-20">
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <Header onLogout={handleLogout} />
      
      <div className="flex flex-1">
        <StudentSidebar 
          profile={profile}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeTab={activeTab}
          setActiveTab={handleSidebarTabChange}  // ✅ Use the navigation handler
        />

        <div className={cn(
          "flex-1 transition-all duration-300",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
        )}>
          <main className="pt-20 pb-8 px-4">
            <div className="container mx-auto max-w-3xl">
              {/* Breadcrumb with Back Button */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Link href="/student" className="hover:text-primary flex items-center gap-1">
                    <Home className="h-3 w-3" />
                    Dashboard
                  </Link>
                  <ChevronRight className="h-3 w-3" />
                  <span className="text-foreground">My Profile</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleBackToDashboard}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Button>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Profile Header Card */}
                <Card className="border-0 shadow-lg overflow-hidden">
                  <div className="relative h-32 bg-gradient-to-r from-primary via-primary/80 to-primary/60">
                    <div className="absolute -bottom-16 left-8">
                      <div className="relative">
                        <Avatar className="h-32 w-32 ring-4 ring-white dark:ring-slate-900 shadow-xl">
                          <AvatarImage src={imagePreview || profile?.photo_url || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-3xl font-bold">
                            {getInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute -bottom-2 -right-2 p-2.5 rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 transition-colors"
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
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                      </div>
                    </div>
                    {!isEditing && (
                      <div className="absolute bottom-4 right-6">
                        <Button onClick={() => setIsEditing(true)} className="bg-white text-primary hover:bg-white/90">
                          <User className="mr-2 h-4 w-4" />
                          Edit Profile
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <CardContent className="pt-20 pb-6">
                    <div className="flex flex-wrap justify-between items-start gap-4">
                      <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                          {profile?.full_name}
                        </h1>
                        <p className="text-muted-foreground">{profile?.email}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          <Badge className="bg-primary/10 text-primary">
                            <GraduationCap className="mr-1 h-3 w-3" />
                            {profile?.class}
                          </Badge>
                          <Badge variant="outline">
                            <Shield className="mr-1 h-3 w-3" />
                            VIN: {profile?.vin_id}
                          </Badge>
                        </div>
                      </div>
                      
                      {isEditing && (
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => setIsEditing(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleSaveProfile} disabled={saving}>
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Profile Details Card */}
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Your personal and contact information</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <div className="space-y-4">
                        <div>
                          <Label>Full Name</Label>
                          <Input
                            value={editForm.full_name}
                            onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                            placeholder="Your full name"
                          />
                        </div>
                        <div>
                          <Label>Phone Number</Label>
                          <Input
                            value={editForm.phone}
                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                            placeholder="+234 XXX XXX XXXX"
                          />
                        </div>
                        <div>
                          <Label>Address</Label>
                          <Textarea
                            value={editForm.address}
                            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                            placeholder="Your address"
                            rows={2}
                          />
                        </div>
                        <div>
                          <Label>Bio (Optional)</Label>
                          <Textarea
                            value={editForm.bio}
                            onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                            placeholder="Tell us a little about yourself..."
                            rows={3}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
                            <User className="h-5 w-5 text-primary" />
                            <div>
                              <p className="text-xs text-muted-foreground">Full Name</p>
                              <p className="font-medium">{profile?.full_name || '-'}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
                            <Mail className="h-5 w-5 text-primary" />
                            <div>
                              <p className="text-xs text-muted-foreground">Email Address</p>
                              <p className="font-medium text-sm">{profile?.email || '-'}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
                            <Phone className="h-5 w-5 text-primary" />
                            <div>
                              <p className="text-xs text-muted-foreground">Phone Number</p>
                              <p className="font-medium">{profile?.phone || '-'}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
                            <Calendar className="h-5 w-5 text-primary" />
                            <div>
                              <p className="text-xs text-muted-foreground">Admission Year</p>
                              <p className="font-medium">{profile?.admission_year || '-'}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
                          <MapPin className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground">Address</p>
                            <p className="font-medium">{profile?.address || 'No address added yet.'}</p>
                          </div>
                        </div>
                        
                        {profile?.bio && (
                          <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
                            <User className="h-5 w-5 text-primary mt-0.5" />
                            <div>
                              <p className="text-xs text-muted-foreground">Bio</p>
                              <p className="font-medium text-sm">{profile.bio}</p>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
                          <Shield className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-xs text-muted-foreground">VIN ID (Permanent ID)</p>
                            <p className="font-mono text-sm">{profile?.vin_id || '-'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
                          <Calendar className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-xs text-muted-foreground">Member Since</p>
                            <p className="font-medium text-sm">
                              {profile?.created_at 
                                ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                                : '-'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}