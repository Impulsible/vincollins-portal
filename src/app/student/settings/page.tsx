/* eslint-disable @typescript-eslint/no-unused-vars */
// app/student/settings/page.tsx - FULLY RESPONSIVE, NO DARK MODE
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { StudentSidebar } from '@/components/student/StudentSidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Loader2, User, Bell, Shield, Palette, Globe, Volume2,
  Save, ChevronRight, Home, ArrowLeft,
  Monitor, CheckCircle, AlertCircle,
  Mail, Smartphone, Trash2, Sunset, Eye, Lock, MessageSquare, Activity
} from 'lucide-react'
import Link from 'next/link'

interface StudentProfile {
  id: string
  full_name: string
  email: string
  class: string
  department: string
  vin_id?: string
  photo_url?: string
}

interface NotificationPreferences {
  email_notifications: boolean
  push_notifications: boolean
  exam_reminders: boolean
  assignment_deadlines: boolean
  result_notifications: boolean
  announcement_notifications: boolean
  sound_enabled: boolean
}

interface AppearanceSettings {
  font_size: 'small' | 'medium' | 'large'
  reduced_motion: boolean
  high_contrast: boolean
}

interface PrivacySettings {
  show_online_status: boolean
  show_profile_to_classmates: boolean
  allow_messages: boolean
  show_activity_feed: boolean
}

export default function StudentSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('account')
  
  // Delete account states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deleting, setDeleting] = useState(false)
  
  // Notification preferences
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    email_notifications: true,
    push_notifications: true,
    exam_reminders: true,
    assignment_deadlines: true,
    result_notifications: true,
    announcement_notifications: true,
    sound_enabled: true
  })
  
  // Appearance settings (no dark mode)
  const [appearance, setAppearance] = useState<AppearanceSettings>({
    font_size: 'medium',
    reduced_motion: false,
    high_contrast: false
  })
  
  // Privacy settings
  const [privacy, setPrivacy] = useState<PrivacySettings>({
    show_online_status: true,
    show_profile_to_classmates: true,
    allow_messages: true,
    show_activity_feed: true
  })

  const getInitials = (name?: string): string => {
    if (!name) return 'S'
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return parts[0].slice(0, 2).toUpperCase()
  }

  const formatProfileForHeader = (profile: StudentProfile | null) => {
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

  const loadSettings = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/portal')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()

      if (!profileData || profileData.role !== 'student') {
        toast.error('Access denied')
        router.push('/portal')
        return
      }

      setProfile({
        id: profileData.id,
        full_name: profileData.full_name || 'Student',
        email: profileData.email,
        class: profileData.class || 'Not Assigned',
        department: profileData.department || 'General',
        vin_id: profileData.vin_id,
        photo_url: profileData.photo_url
      })

      // Load saved settings from localStorage
      const savedNotifications = localStorage.getItem('student_notification_prefs')
      if (savedNotifications) {
        setNotificationPrefs(JSON.parse(savedNotifications))
      }
      
      const savedAppearance = localStorage.getItem('student_appearance')
      if (savedAppearance) {
        setAppearance(JSON.parse(savedAppearance))
      }
      
      const savedPrivacy = localStorage.getItem('student_privacy')
      if (savedPrivacy) {
        setPrivacy(JSON.parse(savedPrivacy))
      }

      // Apply font size
      applyFontSize(appearance.font_size)

    } catch (error) {
      console.error('Error loading settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: 'local' })
    toast.success('Logged out successfully')
    router.push('/portal')
  }

  const applyFontSize = (size: 'small' | 'medium' | 'large') => {
    const root = document.documentElement
    if (size === 'small') {
      root.style.fontSize = '14px'
    } else if (size === 'medium') {
      root.style.fontSize = '16px'
    } else if (size === 'large') {
      root.style.fontSize = '18px'
    }
  }

  const saveNotificationSettings = () => {
    localStorage.setItem('student_notification_prefs', JSON.stringify(notificationPrefs))
    toast.success('Notification preferences saved!')
  }

  const saveAppearanceSettings = () => {
    localStorage.setItem('student_appearance', JSON.stringify(appearance))
    applyFontSize(appearance.font_size)
    
    // Apply reduced motion
    if (appearance.reduced_motion) {
      document.documentElement.classList.add('reduce-motion')
    } else {
      document.documentElement.classList.remove('reduce-motion')
    }
    
    // Apply high contrast
    if (appearance.high_contrast) {
      document.documentElement.classList.add('high-contrast')
    } else {
      document.documentElement.classList.remove('high-contrast')
    }
    
    toast.success('Appearance settings saved!')
  }

  const savePrivacySettings = () => {
    localStorage.setItem('student_privacy', JSON.stringify(privacy))
    toast.success('Privacy settings saved!')
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      toast.error('Please type DELETE to confirm')
      return
    }

    setDeleting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No session')

      await supabase.from('profiles').delete().eq('id', session.user.id)
      await supabase.auth.signOut()

      toast.success('Account deleted successfully')
      router.push('/portal')
    } catch (error) {
      console.error('Error deleting account:', error)
      toast.error('Failed to delete account. Please contact support.')
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 overflow-x-hidden w-full">
        <Header onLogout={handleLogout} />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col overflow-x-hidden w-full">
      <Header user={formatProfileForHeader(profile)} onLogout={handleLogout} />
      
      <div className="flex flex-1 w-full overflow-x-hidden">
        <StudentSidebar 
          profile={profile}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeTab="settings"
          setActiveTab={() => {}}
        />

        <div className={cn(
          "flex-1 transition-all duration-300 w-full overflow-x-hidden",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
        )}>
          <main className="pt-16 lg:pt-20 pb-24 lg:pb-12 px-3 sm:px-4 lg:px-6 w-full overflow-x-hidden">
            <div className="container mx-auto max-w-4xl px-0">
              
              {/* Breadcrumb - Responsive */}
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
                  <Link href="/student" className="hover:text-emerald-600 flex items-center gap-1 transition-colors">
                    <Home className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    <span className="hidden xs:inline">Dashboard</span>
                    <span className="xs:hidden">Home</span>
                  </Link>
                  <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="text-foreground font-medium">Settings</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => router.push('/student')} className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9">
                  <ArrowLeft className="mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  Back to Dashboard
                </Button>
              </motion.div>

              {/* Profile Summary - Responsive */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 sm:mb-6 w-full overflow-hidden"
              >
                <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50 overflow-hidden">
                  <CardContent className="p-3 sm:p-4 lg:p-5">
                    <div className="flex flex-col xs:flex-row items-center xs:items-start gap-3 sm:gap-4 text-center xs:text-left">
                      <Avatar className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 ring-2 ring-white shrink-0">
                        <AvatarImage src={profile?.photo_url} />
                        <AvatarFallback className="bg-emerald-600 text-white text-base sm:text-lg md:text-xl">
                          {getInitials(profile?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 truncate">{profile?.full_name}</h2>
                        <p className="text-xs sm:text-sm text-gray-600 break-all">{profile?.email}</p>
                        <div className="flex flex-wrap justify-center xs:justify-start gap-1.5 mt-1">
                          <Badge variant="outline" className="bg-white text-[10px] sm:text-xs">{profile?.class}</Badge>
                          <Badge variant="outline" className="bg-white text-[10px] sm:text-xs">{profile?.vin_id}</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Settings Tabs - Responsive */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="w-full overflow-hidden"
              >
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
                  <TabsList className="grid w-full grid-cols-4 bg-white p-1 rounded-xl shadow-sm border h-auto">
                    <TabsTrigger value="account" className="rounded-lg data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-[11px] xs:text-xs sm:text-sm py-1.5 sm:py-2">
                      <User className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 mr-0.5 xs:mr-1 sm:mr-2" />
                      <span className="hidden xs:inline">Account</span>
                      <span className="xs:hidden">Acct</span>
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="rounded-lg data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-[11px] xs:text-xs sm:text-sm py-1.5 sm:py-2">
                      <Bell className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 mr-0.5 xs:mr-1 sm:mr-2" />
                      <span className="hidden xs:inline">Notifications</span>
                      <span className="xs:hidden">Notif</span>
                    </TabsTrigger>
                    <TabsTrigger value="appearance" className="rounded-lg data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-[11px] xs:text-xs sm:text-sm py-1.5 sm:py-2">
                      <Palette className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 mr-0.5 xs:mr-1 sm:mr-2" />
                      <span className="hidden xs:inline">Appearance</span>
                      <span className="xs:hidden">Appear</span>
                    </TabsTrigger>
                    <TabsTrigger value="privacy" className="rounded-lg data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-[11px] xs:text-xs sm:text-sm py-1.5 sm:py-2">
                      <Shield className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 mr-0.5 xs:mr-1 sm:mr-2" />
                      <span className="hidden xs:inline">Privacy</span>
                      <span className="xs:hidden">Priv</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* ACCOUNT TAB */}
                  <TabsContent value="account" className="space-y-4 sm:space-y-6">
                    <Card className="border-0 shadow-sm bg-white overflow-hidden">
                      <CardHeader className="px-3 sm:px-4 md:px-5 pt-4 sm:pt-5 pb-2">
                        <CardTitle className="text-base sm:text-lg">Account Information</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Manage your account details</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-4 md:px-5 pb-4 sm:pb-5">
                        {/* Email */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium text-sm sm:text-base">Email Address</p>
                              <p className="text-xs sm:text-sm text-slate-500 break-all">{profile?.email}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="gap-1 shrink-0 text-[10px] sm:text-xs w-fit">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            Verified
                          </Badge>
                        </div>

                        {/* Two-Factor Authentication */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <Smartphone className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 shrink-0" />
                            <div>
                              <p className="font-medium text-sm sm:text-base">Two-Factor Authentication</p>
                              <p className="text-xs sm:text-sm text-slate-500">Add an extra layer of security</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" disabled className="shrink-0 text-[11px] sm:text-xs">
                            Coming Soon
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Danger Zone */}
                    <Card className="border-0 shadow-sm bg-white border-l-4 border-l-red-500 overflow-hidden">
                      <CardHeader className="px-3 sm:px-4 md:px-5 pt-4 sm:pt-5 pb-2">
                        <CardTitle className="text-red-600 text-base sm:text-lg">Danger Zone</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Irreversible actions for your account</CardDescription>
                      </CardHeader>
                      <CardContent className="px-3 sm:px-4 md:px-5 pb-4 sm:pb-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-sm sm:text-base">Delete Account</p>
                            <p className="text-xs sm:text-sm text-slate-500">Permanently delete your account and all data</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50 shrink-0 text-xs sm:text-sm h-8 sm:h-9"
                            onClick={() => setShowDeleteDialog(true)}
                          >
                            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                            Delete Account
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* NOTIFICATIONS TAB */}
                  <TabsContent value="notifications" className="space-y-4 sm:space-y-6">
                    <Card className="border-0 shadow-sm bg-white overflow-hidden">
                      <CardHeader className="px-3 sm:px-4 md:px-5 pt-4 sm:pt-5 pb-2">
                        <CardTitle className="text-base sm:text-lg">Notification Preferences</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Choose what notifications you want to receive</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-4 md:px-5 pb-4 sm:pb-5">
                        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl">
                          <div>
                            <p className="font-medium text-sm">Email Notifications</p>
                            <p className="text-xs text-slate-500">Receive notifications via email</p>
                          </div>
                          <Switch
                            checked={notificationPrefs.email_notifications}
                            onCheckedChange={(checked) => setNotificationPrefs(prev => ({ ...prev, email_notifications: checked }))}
                          />
                        </div>

                        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl">
                          <div>
                            <p className="font-medium text-sm">Push Notifications</p>
                            <p className="text-xs text-slate-500">Receive notifications in browser</p>
                          </div>
                          <Switch
                            checked={notificationPrefs.push_notifications}
                            onCheckedChange={(checked) => setNotificationPrefs(prev => ({ ...prev, push_notifications: checked }))}
                          />
                        </div>

                        <Separator />

                        <h4 className="font-semibold text-xs sm:text-sm text-slate-700 pt-1">Notification Types</h4>

                        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl">
                          <div>
                            <p className="font-medium text-sm">Exam Reminders</p>
                            <p className="text-xs text-slate-500">Get reminded about upcoming exams</p>
                          </div>
                          <Switch
                            checked={notificationPrefs.exam_reminders}
                            onCheckedChange={(checked) => setNotificationPrefs(prev => ({ ...prev, exam_reminders: checked }))}
                          />
                        </div>

                        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl">
                          <div>
                            <p className="font-medium text-sm">Assignment Deadlines</p>
                            <p className="text-xs text-slate-500">Notifications for assignment due dates</p>
                          </div>
                          <Switch
                            checked={notificationPrefs.assignment_deadlines}
                            onCheckedChange={(checked) => setNotificationPrefs(prev => ({ ...prev, assignment_deadlines: checked }))}
                          />
                        </div>

                        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl">
                          <div>
                            <p className="font-medium text-sm">Result Notifications</p>
                            <p className="text-xs text-slate-500">Get notified when results are published</p>
                          </div>
                          <Switch
                            checked={notificationPrefs.result_notifications}
                            onCheckedChange={(checked) => setNotificationPrefs(prev => ({ ...prev, result_notifications: checked }))}
                          />
                        </div>

                        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl">
                          <div>
                            <p className="font-medium text-sm">Announcements</p>
                            <p className="text-xs text-slate-500">School-wide announcements</p>
                          </div>
                          <Switch
                            checked={notificationPrefs.announcement_notifications}
                            onCheckedChange={(checked) => setNotificationPrefs(prev => ({ ...prev, announcement_notifications: checked }))}
                          />
                        </div>

                        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <Volume2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 shrink-0" />
                            <div>
                              <p className="font-medium text-sm">Notification Sound</p>
                              <p className="text-xs text-slate-500">Play sound for new notifications</p>
                            </div>
                          </div>
                          <Switch
                            checked={notificationPrefs.sound_enabled}
                            onCheckedChange={(checked) => setNotificationPrefs(prev => ({ ...prev, sound_enabled: checked }))}
                          />
                        </div>
                      </CardContent>
                      <div className="px-3 sm:px-4 md:px-5 pb-4 sm:pb-5">
                        <Button onClick={saveNotificationSettings} className="w-full bg-emerald-600 hover:bg-emerald-700 text-sm h-9 sm:h-10">
                          <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                          Save Notification Settings
                        </Button>
                      </div>
                    </Card>
                  </TabsContent>

                  {/* APPEARANCE TAB - NO DARK MODE */}
                  <TabsContent value="appearance" className="space-y-4 sm:space-y-6">
                    <Card className="border-0 shadow-sm bg-white overflow-hidden">
                      <CardHeader className="px-3 sm:px-4 md:px-5 pt-4 sm:pt-5 pb-2">
                        <CardTitle className="text-base sm:text-lg">Appearance Settings</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Customize how the platform looks</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-5 sm:space-y-6 px-3 sm:px-4 md:px-5 pb-4 sm:pb-5">
                        {/* Font Size */}
                        <div>
                          <Label className="mb-2 sm:mb-3 block text-sm">Font Size</Label>
                          <Select value={appearance.font_size} onValueChange={(value: 'small' | 'medium' | 'large') => setAppearance(prev => ({ ...prev, font_size: value }))}>
                            <SelectTrigger className="text-sm h-9 sm:h-10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="small">Small</SelectItem>
                              <SelectItem value="medium">Medium (Default)</SelectItem>
                              <SelectItem value="large">Large</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <Separator />

                        {/* Accessibility */}
                        <div className="space-y-3 sm:space-y-4">
                          <h4 className="font-semibold text-xs sm:text-sm text-slate-700">Accessibility</h4>
                          
                          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl">
                            <div>
                              <p className="font-medium text-sm">Reduced Motion</p>
                              <p className="text-xs text-slate-500">Minimize animations and transitions</p>
                            </div>
                            <Switch
                              checked={appearance.reduced_motion}
                              onCheckedChange={(checked) => setAppearance(prev => ({ ...prev, reduced_motion: checked }))}
                            />
                          </div>

                          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl">
                            <div>
                              <p className="font-medium text-sm">High Contrast</p>
                              <p className="text-xs text-slate-500">Increase contrast for better visibility</p>
                            </div>
                            <Switch
                              checked={appearance.high_contrast}
                              onCheckedChange={(checked) => setAppearance(prev => ({ ...prev, high_contrast: checked }))}
                            />
                          </div>
                        </div>
                      </CardContent>
                      <div className="px-3 sm:px-4 md:px-5 pb-4 sm:pb-5">
                        <Button onClick={saveAppearanceSettings} className="w-full bg-emerald-600 hover:bg-emerald-700 text-sm h-9 sm:h-10">
                          <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                          Save Appearance Settings
                        </Button>
                      </div>
                    </Card>
                  </TabsContent>

                  {/* PRIVACY TAB */}
                  <TabsContent value="privacy" className="space-y-4 sm:space-y-6">
                    <Card className="border-0 shadow-sm bg-white overflow-hidden">
                      <CardHeader className="px-3 sm:px-4 md:px-5 pt-4 sm:pt-5 pb-2">
                        <CardTitle className="text-base sm:text-lg">Privacy Settings</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Control your privacy and visibility</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-4 md:px-5">
                        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl">
                          <div>
                            <p className="font-medium text-sm">Show Online Status</p>
                            <p className="text-xs text-slate-500">Let others see when you're online</p>
                          </div>
                          <Switch
                            checked={privacy.show_online_status}
                            onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, show_online_status: checked }))}
                          />
                        </div>

                        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl">
                          <div>
                            <p className="font-medium text-sm">Profile Visibility</p>
                            <p className="text-xs text-slate-500">Show your profile to classmates</p>
                          </div>
                          <Switch
                            checked={privacy.show_profile_to_classmates}
                            onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, show_profile_to_classmates: checked }))}
                          />
                        </div>

                        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl">
                          <div>
                            <p className="font-medium text-sm">Allow Messages</p>
                            <p className="text-xs text-slate-500">Receive messages from teachers and classmates</p>
                          </div>
                          <Switch
                            checked={privacy.allow_messages}
                            onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, allow_messages: checked }))}
                          />
                        </div>

                        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl">
                          <div>
                            <p className="font-medium text-sm">Activity Feed</p>
                            <p className="text-xs text-slate-500">Show your recent activity to others</p>
                          </div>
                          <Switch
                            checked={privacy.show_activity_feed}
                            onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, show_activity_feed: checked }))}
                          />
                        </div>
                      </CardContent>
                      <div className="px-3 sm:px-4 md:px-5 pb-4 sm:pb-5">
                        <Button onClick={savePrivacySettings} className="w-full bg-emerald-600 hover:bg-emerald-700 text-sm h-9 sm:h-10">
                          <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                          Save Privacy Settings
                        </Button>
                      </div>
                    </Card>
                  </TabsContent>
                </Tabs>
              </motion.div>
            </div>
          </main>
        </div>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2 text-base sm:text-lg">
              <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
              Delete Account
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              This action cannot be undone. This will permanently delete your account and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-3 sm:py-4">
            <p className="text-xs sm:text-sm font-medium mb-2">Type <span className="font-mono bg-slate-100 px-2 py-1 rounded">DELETE</span> to confirm:</p>
            <Input
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="DELETE"
              className="font-mono text-sm h-9 sm:h-10"
            />
          </div>
          
          <AlertDialogFooter className="flex flex-col xs:flex-row gap-2">
            <AlertDialogCancel className="text-xs sm:text-sm h-9">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleting || deleteConfirmation !== 'DELETE'}
              className="bg-red-600 hover:bg-red-700 text-xs sm:text-sm h-9"
            >
              {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}