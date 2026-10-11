// app/student/profile/page.tsx - COMPLETE FIXED VERSION WITH DARK MODE

/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { StudentSidebar } from '@/components/student/StudentSidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  User, Mail, Phone, MapPin, Calendar, GraduationCap,
  Camera, Loader2, Save, ChevronRight, Home, ArrowLeft,
  Hash, Fingerprint, Sparkles, Edit3, BookOpen, Users, 
  BookMarked, School, Award, Trophy, Target
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { getFirstName, getDisplayName as getDisplayNameFromProfile } from '@/lib/get-display-name'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface StudentProfile {
  id: string
  full_name: string
  display_name?: string
  first_name?: string
  middle_name?: string
  last_name?: string
  email: string
  vin_id: string
  admission_number?: string
  class: string
  department: string
  phone: string
  address: string
  admission_year: number
  photo_url: string | null
  cover_photo_url?: string | null
  avatar_url?: string | null
  is_active: boolean
  created_at: string
  bio?: string
}

function FullScreenImageViewer({ 
  imageUrl, 
  title, 
  open, 
  onClose 
}: { 
  imageUrl: string | null | undefined; 
  title: string; 
  open: boolean; 
  onClose: () => void;
}) {
  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden rounded-2xl border-0 bg-black/95">
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-3 sm:p-4 bg-gradient-to-b from-black/70 to-transparent">
            <h3 className="text-white font-medium text-sm sm:text-base truncate">{title}</h3>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white p-0">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
          <div className="flex items-center justify-center min-h-[300px] max-h-[85vh] p-4">
            {imageUrl ? (
              <img src={imageUrl} alt={title} className="max-w-full max-h-[85vh] object-contain rounded-lg" />
            ) : (
              <div className="flex flex-col items-center justify-center p-8">
                <User className="h-16 w-16 text-slate-500" />
                <p className="mt-4 text-slate-400">No image available</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function StudentProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  
  const [stats, setStats] = useState({
    classmates: 0,
    completedExams: 0,
    averageScore: 0
  })
  
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isUploadingCover, setIsUploadingCover] = useState(false)
  const [fullscreenImage, setFullscreenImage] = useState<{ url: string; title: string } | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const [avatarKey, setAvatarKey] = useState(Date.now())
  
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: '',
    address: '',
    bio: ''
  })

  const [currentTerm, setCurrentTerm] = useState('')
  const [currentSession, setCurrentSession] = useState('')

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

  async function fetchCurrentTermAndSession(): Promise<{ term: string; session: string }> {
    try {
      const { data: settings, error } = await supabase
        .from('school_settings')
        .select('current_term, current_session')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error || !settings) {
        return { term: '', session: '' }
      }

      return {
        term: settings.current_term || '',
        session: settings.current_session || ''
      }
    } catch (error) {
      console.error('Error fetching current term:', error)
      return { term: '', session: '' }
    }
  }

  useEffect(() => {
    loadProfile()
    loadCurrentTerm()
  }, [])

  async function loadCurrentTerm() {
    const { term, session } = await fetchCurrentTermAndSession()
    setCurrentTerm(term)
    setCurrentSession(session)
  }

  async function loadProfile() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/portal')
        return
      }

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

      if (profileData) {
        setProfile(profileData as StudentProfile)
        setEditForm({
          full_name: profileData.full_name || '',
          phone: profileData.phone || '',
          address: profileData.address || '',
          bio: profileData.bio || ''
        })
        
        await loadStats(session.user.id, profileData.class, profileData.department)
      } else {
        const emailName = session.user.email?.split('@')[0] || 'Student'
        const formattedName = emailName.split('.').map((n: string) => 
          n.charAt(0).toUpperCase() + n.slice(1)
        ).join(' ')
        
        const newProfile: StudentProfile = {
          id: session.user.id,
          full_name: formattedName,
          display_name: formattedName,
          email: session.user.email || '',
          vin_id: 'N/A',
          admission_number: '',
          class: 'Not Assigned',
          department: 'General',
          phone: '',
          address: '',
          admission_year: new Date().getFullYear(),
          photo_url: null,
          cover_photo_url: null,
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
          display_name: formattedName,
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

  async function loadStats(userId: string, studentClass: string, department: string) {
    try {
      let classmatesCount = 0
      
      try {
        const { count: exactCount, error: exactError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('class', studentClass)
          .eq('role', 'student')
          .neq('id', userId)
        
        if (!exactError) {
          classmatesCount = exactCount || 0
        }
        
        if (classmatesCount === 0) {
          const { count: likeCount, error: likeError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .ilike('class', `%${studentClass}%`)
            .eq('role', 'student')
            .neq('id', userId)
          
          if (!likeError) {
            classmatesCount = likeCount || 0
          }
        }
        
        if (classmatesCount === 0) {
          const classLevelMatch = studentClass.match(/^(JSS[1-3]|SS[1-3])/i)
          const classLevel = classLevelMatch ? classLevelMatch[0].toUpperCase() : ''
          
          if (classLevel) {
            const { count: levelCount, error: levelError } = await supabase
              .from('profiles')
              .select('*', { count: 'exact', head: true })
              .ilike('class', `%${classLevel}%`)
              .eq('role', 'student')
              .neq('id', userId)
            
            if (!levelError) {
              classmatesCount = levelCount || 0
            }
          }
        }
      } catch (e) {
        console.log('classmates count query failed:', e)
      }

      let completedExams = 0
      let averageScore = 0

      if (currentTerm && currentSession) {
        try {
          const { data: attempts, error: attemptsError } = await supabase
            .from('exam_attempts')
            .select('percentage, status')
            .eq('student_id', userId)
            .eq('term', currentTerm)
            .eq('session_year', currentSession)
            .in('status', ['completed', 'graded'])

          if (!attemptsError && attempts && attempts.length > 0) {
            completedExams = attempts.length
            const totalScore = attempts.reduce((sum, a) => sum + (a.percentage || 0), 0)
            averageScore = Math.round(totalScore / attempts.length)
          }
        } catch (e) {
          console.log('exam attempts query failed:', e)
        }
      }

      setStats({
        classmates: classmatesCount || 0,
        completedExams: completedExams || 0,
        averageScore: averageScore || 0
      })
    } catch (error) {
      console.error('Error loading stats:', error)
      setStats({ classmates: 0, completedExams: 0, averageScore: 0 })
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB')
      return
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    setIsUploadingAvatar(true)
    
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `avatar-${profile?.id}-${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('student-photos')
        .upload(fileName, file, { cacheControl: '3600', upsert: false })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('student-photos').getPublicUrl(fileName)
      const publicUrl = urlData.publicUrl

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ photo_url: publicUrl, avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', profile?.id)

      if (updateError) throw updateError

      setProfile(prev => prev ? { ...prev, photo_url: publicUrl, avatar_url: publicUrl } : null)
      setAvatarKey(Date.now())
      toast.success('Profile photo updated!')
      
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload photo')
    } finally {
      setIsUploadingAvatar(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Cover image should be less than 5MB')
      return
    }

    setIsUploadingCover(true)
    
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `cover-${profile?.id}-${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('student-photos')
        .upload(fileName, file, { cacheControl: '3600', upsert: false })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('student-photos').getPublicUrl(fileName)
      const publicUrl = urlData.publicUrl

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ cover_photo_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', profile?.id)

      if (updateError) throw updateError

      setProfile(prev => prev ? { ...prev, cover_photo_url: publicUrl } : null)
      toast.success('Cover photo updated!')
      
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload cover')
    } finally {
      setIsUploadingCover(false)
      if (coverInputRef.current) coverInputRef.current.value = ''
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

      setProfile({ ...profile, ...updates })
      setIsEditing(false)
      toast.success('Profile updated!')
      
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/portal')
  }

  // ✅ Local display name (for UI on this page — full name)
  const getLocalDisplayName = (): string => {
    if (!profile) return 'Student'
    return profile.display_name || profile.full_name || 'Student'
  }

  const getInitials = (): string => {
    const name = getLocalDisplayName()
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
  }

  // ✅ FIXED: Uses shared getFirstName helper → "Esther" not "Soga"
  const formatProfileForHeader = () => {
    if (!profile) return undefined
    return {
      id: profile.id,
      name: getDisplayNameFromProfile(profile, 'Student'),
      firstName: getFirstName(profile),   // ✅ "Esther"
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pt-20 transition-colors duration-300">
          <div className="container mx-auto px-4 max-w-4xl">
            <Skeleton className="h-64 w-full rounded-2xl mb-6 bg-slate-200 dark:bg-slate-800" />
            <Skeleton className="h-96 w-full rounded-2xl bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      </>
    )
  }

  const displayName = getLocalDisplayName()
  const coverPhotoUrl = profile?.cover_photo_url

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300">
      <Header user={formatProfileForHeader()} onLogout={handleLogout} />
      
      <div className="flex">
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
          <main className="pt-20 lg:pt-24 pb-12">
            <div className="container mx-auto px-4 max-w-4xl">
              
              {/* Breadcrumb */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <Link href="/student" className="hover:text-emerald-600 dark:hover:text-emerald-400">Dashboard</Link>
                  <ChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <span className="text-slate-800 dark:text-slate-200 font-medium">Profile</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => router.push('/student')}
                  className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              </div>

              {/* Profile Header */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mb-6">
                {/* Cover Photo */}
                <div className="relative h-36 md:h-48 bg-gradient-to-r from-emerald-500 to-teal-500">
                  {coverPhotoUrl && (
                    <img 
                      src={coverPhotoUrl} 
                      alt="Cover" 
                      className="w-full h-full object-cover"
                    />
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="absolute top-3 right-3 bg-black/50 text-white border-white/20 hover:bg-black/70"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={isUploadingCover}
                  >
                    <Camera className="h-3.5 w-3.5 mr-1" />
                    Change Cover
                  </Button>
                  <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                </div>

                {/* Profile Info */}
                <div className="px-6 pb-6">
                  <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-12 mb-4">
                    <div className="relative">
                      <Avatar className="h-24 w-24 md:h-28 md:w-28 ring-4 ring-white dark:ring-slate-900 shadow-xl">
                        <AvatarImage src={profile?.photo_url || undefined} key={avatarKey} />
                        <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-2xl font-bold">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <button
                        onClick={() => avatarInputRef.current?.click()}
                        className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
                        disabled={isUploadingAvatar}
                      >
                        {isUploadingAvatar ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
                      </button>
                      <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">
                            {displayName}
                          </h1>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-0">
                              <GraduationCap className="h-3 w-3 mr-1" />
                              {profile?.class}
                            </Badge>
                            <Badge variant="outline" className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                              <Fingerprint className="h-3 w-3 mr-1" />
                              VIN: {profile?.vin_id}
                            </Badge>
                            {profile?.admission_number && (
                              <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400">
                                <Hash className="h-3 w-3 mr-1" />
                                {profile.admission_number}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {!isEditing ? (
                          <Button 
                            onClick={() => setIsEditing(true)} 
                            variant="outline" 
                            size="sm"
                            className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            <Edit3 className="h-4 w-4 mr-2" />
                            Edit Profile
                          </Button>
                        ) : (
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setIsEditing(false)}
                              className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                            >
                              Cancel
                            </Button>
                            <Button 
                              size="sm" 
                              className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500" 
                              onClick={handleSaveProfile} 
                              disabled={saving}
                            >
                              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                              Save
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-1">
                    <Mail className="h-4 w-4" />
                    <span>{profile?.email}</span>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <StatCard 
                  icon={Users} 
                  label="Classmates" 
                  value={stats.classmates.toString()} 
                  color="emerald"
                />
                <StatCard 
                  icon={Trophy} 
                  label="Exams Done" 
                  value={stats.completedExams.toString()} 
                  color="amber"
                />
                <StatCard 
                  icon={Target} 
                  label="Avg Score" 
                  value={stats.completedExams > 0 ? `${stats.averageScore}%` : '-'} 
                  color="rose"
                />
              </div>

              {/* Personal Info Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Personal Information</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Your personal details and contact information</p>
                </div>
                
                <div className="p-6">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-slate-700 dark:text-slate-300">Full Name</Label>
                        <Input 
                          value={editForm.full_name} 
                          onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} 
                          className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-700 dark:text-slate-300">Phone Number</Label>
                        <Input 
                          value={editForm.phone} 
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} 
                          className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-700 dark:text-slate-300">Address</Label>
                        <Textarea 
                          value={editForm.address} 
                          onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} 
                          rows={2}
                          className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-700 dark:text-slate-300">Bio</Label>
                        <Textarea 
                          value={editForm.bio} 
                          onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} 
                          rows={3} 
                          placeholder="Tell us about yourself..."
                          className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InfoItem icon={User} label="Full Name" value={profile?.full_name || '-'} />
                      <InfoItem icon={Mail} label="Email" value={profile?.email || '-'} />
                      <InfoItem icon={Phone} label="Phone" value={profile?.phone || 'Not provided'} />
                      <InfoItem icon={Calendar} label="Admission Year" value={profile?.admission_year?.toString() || '-'} />
                      <InfoItem icon={MapPin} label="Address" value={profile?.address || 'Not provided'} />
                      <InfoItem icon={GraduationCap} label="Department" value={profile?.department || 'General'} />
                      {profile?.bio && <InfoItem icon={Sparkles} label="Bio" value={profile.bio} fullWidth />}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {fullscreenImage && (
        <FullScreenImageViewer
          imageUrl={fullscreenImage.url}
          title={fullscreenImage.title}
          open={!!fullscreenImage}
          onClose={() => setFullscreenImage(null)}
        />
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  const colorClasses = {
    emerald: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400",
    amber: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400",
    rose: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400",
  }
  
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-center hover:shadow-md dark:hover:shadow-slate-950/50 transition-shadow">
      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center mx-auto mb-2", colorClasses[color as keyof typeof colorClasses])}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  )
}

function InfoItem({ icon: Icon, label, value, fullWidth = false }: { icon: React.ElementType; label: string; value: string; fullWidth?: boolean }) {
  return (
    <div className={cn(
      "flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800",
      fullWidth && "md:col-span-2"
    )}>
      <div className="p-1.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg">
        <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div className="flex-1">
        <p className="text-xs text-slate-400 dark:text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{value || 'Not provided'}</p>
      </div>
    </div>
  )
}