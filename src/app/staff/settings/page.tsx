// app/staff/settings/page.tsx - STAFF SETTINGS PAGE (FIXED COLUMN NAMES)
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { 
  Settings, Bell, Mail, Loader2, Save, ArrowLeft, 
  ChevronRight, Home, CheckCircle, BookOpen, GraduationCap,
  Clock, AlertTriangle, Megaphone, FileText, Users, Calendar
} from 'lucide-react'
import Link from 'next/link'

// ============================================
// TYPES
// ============================================
interface StaffProfile {
  id: string
  full_name: string | null
  email: string | null
  role?: string | null
  photo_url?: string | null
  department?: string | null
  vin_id?: string | null
  created_at?: string | null
}

interface SettingsState {
  emailNotifications: boolean
  examReminders: boolean
  gradingAlerts: boolean
  studentActivity: boolean
  soundEnabled: boolean
  systemAnnouncements: boolean
  timetableUpdates: boolean
  reportGeneration: boolean
}

const DEFAULT_SETTINGS: SettingsState = {
  emailNotifications: true,
  examReminders: true,
  gradingAlerts: true,
  studentActivity: false,
  soundEnabled: true,
  systemAnnouncements: true,
  timetableUpdates: true,
  reportGeneration: true,
}

// ============================================
// HELPER COMPONENTS
// ============================================
function SettingsSkeleton() {
  return (
    <div className="space-y-3 sm:space-y-4">
      <Skeleton className="h-8 w-40 rounded-lg" />
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  )
}

function SettingToggle({ 
  icon: Icon, title, description, notificationExample, checked, onToggle 
}: { 
  icon: React.ElementType
  title: string
  description: string
  notificationExample: string
  checked: boolean
  onToggle: () => void 
}) {
  return (
    <div className="flex items-start justify-between gap-3 sm:gap-4 py-3">
      <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
        <div className="p-1.5 sm:p-2 bg-slate-100 rounded-lg shrink-0">
          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-slate-900">{title}</p>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">{description}</p>
          <div className="mt-1.5 p-2 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium mb-0.5">YOU WILL RECEIVE:</p>
            <p className="text-[10px] sm:text-xs text-slate-600 italic">
              &ldquo;{notificationExample}&rdquo;
            </p>
          </div>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onToggle} className="shrink-0 mt-1" />
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function StaffSettingsPage() {
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<StaffProfile | null>(null)
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS)

  // ============================================
  // LOAD PROFILE & SETTINGS FROM DATABASE
  // ============================================
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        toast.error('Please login to access settings')
        router.push('/portal')
        return
      }

      // Fetch only columns that exist in your profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, photo_url, department, vin_id, created_at')
        .eq('id', session.user.id)
        .single()

      if (profileError) {
        // Check if it's because the profile doesn't exist
        if (profileError.code === 'PGRST116') {
          console.log('Profile not found for settings page')
          toast.error('Profile not found. Please contact administrator.')
        } else {
          console.error('Error fetching profile:', profileError)
          toast.error('Failed to load profile data')
        }
      } else if (profileData) {
        setProfile(profileData as StaffProfile)
      }

      // Load settings from localStorage
      const savedSettings = localStorage.getItem('staff-settings')
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings)
          setSettings(prev => ({ ...prev, ...parsed }))
        } catch (e) {
          console.error('Error parsing settings:', e)
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ============================================
  // HANDLERS
  // ============================================
  const handleToggle = (key: keyof SettingsState) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    
    try {
      localStorage.setItem('staff-settings', JSON.stringify(settings))
      toast.success('Settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return (
      <div className="px-3 sm:px-4 md:px-5 lg:px-6 py-4 sm:py-5 md:py-6">
        <SettingsSkeleton />
      </div>
    )
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="px-3 sm:px-4 md:px-5 lg:px-6 py-4 sm:py-5 md:py-6">
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 sm:space-y-5 md:space-y-6"
      >
        {/* Breadcrumb & Back Button */}
        <div className="mb-1 sm:mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 sm:gap-2 text-[11px] sm:text-xs md:text-sm text-muted-foreground">
            <Link href="/staff" className="hover:text-primary flex items-center gap-1 transition-colors">
              <Home className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden xs:inline">Dashboard</span>
            </Link>
            <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
            <span className="text-foreground font-medium">Settings</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push('/staff')} 
            className="h-7 sm:h-8 text-[11px] sm:text-xs flex-shrink-0"
          >
            <ArrowLeft className="mr-1 sm:mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5" />
            Back
          </Button>
        </div>

        {/* Page Title */}
        <div className="mb-3 sm:mb-4">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-slate-600" />
            Settings
          </h1>
          <p className="text-[11px] sm:text-xs md:text-sm text-slate-500 mt-0.5">
            Manage your notification preferences and account information
          </p>
        </div>

        {/* Settings Content */}
        <div className="space-y-3 sm:space-y-4 md:space-y-6">
          
          {/* Account Info Card */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-4 md:px-6">
              <CardTitle className="text-sm sm:text-base md:text-lg">Account Information</CardTitle>
              <CardDescription className="text-[10px] sm:text-xs md:text-sm">
                Your account details
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 bg-slate-50 rounded-xl">
                  <p className="text-[10px] sm:text-xs text-slate-500 mb-0.5">Full Name</p>
                  <p className="font-medium text-sm sm:text-base text-slate-900">
                    {profile?.full_name || 'Not set'}
                  </p>
                </div>
                <div className="p-3 sm:p-4 bg-slate-50 rounded-xl">
                  <p className="text-[10px] sm:text-xs text-slate-500 mb-0.5">Email Address</p>
                  <p className="font-medium text-sm sm:text-base text-slate-900 break-all">
                    {profile?.email || 'Not set'}
                  </p>
                </div>
                <div className="p-3 sm:p-4 bg-slate-50 rounded-xl">
                  <p className="text-[10px] sm:text-xs text-slate-500 mb-0.5">Role</p>
                  <Badge className="text-[10px] sm:text-xs bg-blue-100 text-blue-700">
                    {profile?.role || 'Staff'}
                  </Badge>
                </div>
                <div className="p-3 sm:p-4 bg-slate-50 rounded-xl">
                  <p className="text-[10px] sm:text-xs text-slate-500 mb-0.5">Staff ID</p>
                  <p className="font-medium text-sm sm:text-base text-slate-900 font-mono">
                    {profile?.vin_id || profile?.id?.slice(0, 8) || 'N/A'}
                  </p>
                </div>
                {profile?.department && (
                  <div className="p-3 sm:p-4 bg-slate-50 rounded-xl">
                    <p className="text-[10px] sm:text-xs text-slate-500 mb-0.5">Department</p>
                    <p className="font-medium text-sm sm:text-base text-slate-900">
                      {profile.department}
                    </p>
                  </div>
                )}
              </div>
              {profile?.created_at && (
                <p className="text-[10px] sm:text-xs text-slate-400 mt-3">
                  Member since: {new Date(profile.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-4 md:px-6">
              <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-2">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                Notification Preferences
              </CardTitle>
              <CardDescription className="text-[10px] sm:text-xs md:text-sm">
                Choose what notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 sm:space-y-2 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
              <SettingToggle 
                icon={Mail} 
                title="Email Notifications" 
                description="Receive important updates via email" 
                notificationExample="Your exam schedule has been updated for next week. Please review the changes."
                checked={settings.emailNotifications} 
                onToggle={() => handleToggle('emailNotifications')} 
              />
              <Separator />
              <SettingToggle 
                icon={Clock} 
                title="Exam Reminders" 
                description="Get notified about upcoming exams and deadlines" 
                notificationExample="Reminder: Mathematics final exam starts in 2 days. 45 students are registered."
                checked={settings.examReminders} 
                onToggle={() => handleToggle('examReminders')} 
              />
              <Separator />
              <SettingToggle 
                icon={CheckCircle} 
                title="Grading Alerts" 
                description="Alerts when students submit exams that need grading" 
                notificationExample="15 new exam submissions are waiting for your review in Physics 101."
                checked={settings.gradingAlerts} 
                onToggle={() => handleToggle('gradingAlerts')} 
              />
              <Separator />
              <SettingToggle 
                icon={Users} 
                title="Student Activity" 
                description="Track student login and exam participation" 
                notificationExample="John Doe just logged in and started the Chemistry practical exam."
                checked={settings.studentActivity} 
                onToggle={() => handleToggle('studentActivity')} 
              />
              <Separator />
              <SettingToggle 
                icon={Megaphone} 
                title="System Announcements" 
                description="Important announcements from administration" 
                notificationExample="Staff meeting scheduled for Friday at 2:00 PM in the conference hall."
                checked={settings.systemAnnouncements} 
                onToggle={() => handleToggle('systemAnnouncements')} 
              />
              <Separator />
              <SettingToggle 
                icon={Calendar} 
                title="Timetable Updates" 
                description="Get notified when your class schedule changes" 
                notificationExample="Your Monday 9AM class has been moved to Room 204 starting next week."
                checked={settings.timetableUpdates} 
                onToggle={() => handleToggle('timetableUpdates')} 
              />
              <Separator />
              <SettingToggle 
                icon={FileText} 
                title="Report Generation" 
                description="Notify when student reports are ready for review" 
                notificationExample="End of term reports for SS2 students have been generated and ready for approval."
                checked={settings.reportGeneration} 
                onToggle={() => handleToggle('reportGeneration')} 
              />
            </CardContent>
          </Card>

          {/* Teaching Preferences */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-4 md:px-6">
              <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-2">
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
                Teaching Preferences
              </CardTitle>
              <CardDescription className="text-[10px] sm:text-xs md:text-sm">
                Configure your teaching and grading defaults
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
              <div className="space-y-3">
                <div className="p-3 sm:p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <GraduationCap className="h-4 w-4 text-emerald-600" />
                    <p className="text-xs sm:text-sm font-medium text-slate-900">Default Grade View</p>
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-500">
                    Current: <span className="font-medium text-slate-700">Percentage & Letter Grade</span>
                  </p>
                </div>
                
                <div className="p-3 sm:p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <p className="text-xs sm:text-sm font-medium text-slate-900">Auto-Save Interval</p>
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-500">
                    Current: <span className="font-medium text-slate-700">Every 5 minutes</span>
                  </p>
                </div>
                
                <div className="p-3 sm:p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <p className="text-xs sm:text-sm font-medium text-slate-900">Low Attendance Alert</p>
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-500">
                    Current: <span className="font-medium text-slate-700">Below 75% attendance</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleSaveSettings} 
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 h-9 sm:h-10 text-xs sm:text-sm"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save All Settings
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}