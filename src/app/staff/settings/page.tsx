// app/staff/settings/page.tsx - STAFF SETTINGS PAGE (NO PASSWORD CHANGE)
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { StaffSidebar } from '@/components/staff/StaffSidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { 
  Settings, Bell, Moon, Sun, Monitor, Palette, Volume2, Mail, 
  Loader2, Save, ArrowLeft, ChevronRight, Home, CheckCircle
} from 'lucide-react'
import Link from 'next/link'

// ============================================
// TYPES
// ============================================
interface StaffProfile {
  id: string
  full_name: string
  email: string
  role?: string
  photo_url?: string
}

interface SettingsState {
  emailNotifications: boolean
  examReminders: boolean
  gradingAlerts: boolean
  studentActivity: boolean
  soundEnabled: boolean
  theme: 'light' | 'dark' | 'system'
  fontSize: 'small' | 'medium' | 'large'
}

const DEFAULT_SETTINGS: SettingsState = {
  emailNotifications: true,
  examReminders: true,
  gradingAlerts: true,
  studentActivity: false,
  soundEnabled: true,
  theme: 'light',
  fontSize: 'medium',
}

// ============================================
// HELPER COMPONENTS
// ============================================
function SettingsSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <Skeleton className="h-10 w-48 rounded-lg" />
      <Skeleton className="h-80 rounded-2xl" />
    </div>
  )
}

function SettingToggle({ 
  icon: Icon, title, description, checked, onToggle 
}: { 
  icon: React.ElementType
  title: string
  description: string
  checked: boolean
  onToggle: () => void 
}) {
  return (
    <div className="flex items-start justify-between gap-3 sm:gap-4 py-2">
      <div className="flex items-start gap-2 sm:gap-3 min-w-0">
        <div className="p-1.5 sm:p-2 bg-slate-100 rounded-lg shrink-0">
          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-600" />
        </div>
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-medium text-slate-900">{title}</p>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onToggle} className="shrink-0" />
    </div>
  )
}

function ThemeOption({ 
  icon: Icon, title, active, onClick 
}: { 
  icon: React.ElementType
  title: string
  active: boolean
  onClick: () => void 
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-xl border-2 transition-all",
        active 
          ? "border-blue-500 bg-blue-50 shadow-sm" 
          : "border-slate-200 hover:border-slate-300 bg-white"
      )}
    >
      <Icon className={cn(
        "h-5 w-5 sm:h-6 sm:w-6",
        active ? "text-blue-600" : "text-slate-400"
      )} />
      <span className={cn(
        "text-[10px] sm:text-xs font-medium",
        active ? "text-blue-700" : "text-slate-600"
      )}>
        {title}
      </span>
    </button>
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS)

  // ============================================
  // LOAD PROFILE & SETTINGS
  // ============================================
  const loadData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/portal')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, photo_url')
        .eq('id', session.user.id)
        .single()

      if (profileData) {
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
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/portal')
  }

  const handleToggle = (key: keyof SettingsState) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleSelectChange = (key: keyof SettingsState, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    
    try {
      // Save to localStorage
      localStorage.setItem('staff-settings', JSON.stringify(settings))
      
      // Apply theme
      if (settings.theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else if (settings.theme === 'light') {
        document.documentElement.classList.remove('dark')
      }
      // 'system' relies on OS preference
      
      // Apply font size
      document.documentElement.style.fontSize = 
        settings.fontSize === 'small' ? '14px' : 
        settings.fontSize === 'large' ? '18px' : '16px'
      
      toast.success('Settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  // ✅ FIXED: Added firstName
  const formatProfileForHeader = () => {
    if (!profile) return undefined
    return {
      id: profile.id,
      name: profile.full_name,
      firstName: profile.full_name?.split(' ')[0] || 'Staff',
      email: profile.email,
      role: 'teacher' as const,
      avatar: profile.photo_url || undefined,
      isAuthenticated: true
    }
  }

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col">
        <Header onLogout={handleLogout} />
        <div className="flex flex-1">
          <div className="hidden lg:block w-72 shrink-0" />
          <div className="flex-1">
            <main className="pt-16 sm:pt-20 lg:pt-24 pb-8 sm:pb-12">
              <div className="w-full max-w-screen-xl mx-auto px-3 sm:px-4 md:px-5 lg:px-6">
                <SettingsSkeleton />
              </div>
            </main>
          </div>
        </div>
      </div>
    )
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col overflow-x-hidden">
      <Header user={formatProfileForHeader()} onLogout={handleLogout} />
      
      <div className="flex flex-1">
        <StaffSidebar 
          profile={profile}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeTab="settings"
          setActiveTab={() => {}}
        />

        <div className={cn(
          "flex-1 transition-all duration-300 overflow-x-hidden min-w-0",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
        )}>
          <main className="pt-16 sm:pt-20 lg:pt-24 pb-8 sm:pb-12">
            <div className="w-full max-w-screen-xl mx-auto px-3 sm:px-4 md:px-5 lg:px-6">
              
              {/* Breadcrumb */}
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
                  <span className="text-foreground font-medium truncate">Settings</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => router.push('/staff')} 
                  className="h-7 sm:h-8 md:h-9 text-[11px] sm:text-xs md:text-sm flex-shrink-0"
                >
                  <ArrowLeft className="mr-1 sm:mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  Back
                </Button>
              </motion.div>

              {/* Page Title */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3 sm:mb-4 md:mb-6"
              >
                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2">
                  <Settings className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-slate-600" />
                  Settings
                </h1>
                <p className="text-[11px] sm:text-xs md:text-sm text-slate-500 mt-0.5 sm:mt-1">
                  Customize your experience and manage preferences
                </p>
              </motion.div>

              {/* Settings Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-3 sm:space-y-4 md:space-y-6"
              >
                {/* Account Info Card */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-4 md:px-6">
                    <CardTitle className="text-sm sm:text-base md:text-lg">Account Information</CardTitle>
                    <CardDescription className="text-[10px] sm:text-xs md:text-sm">
                      Your basic account details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="p-3 sm:p-4 bg-slate-50 rounded-xl">
                        <p className="text-[10px] sm:text-xs text-slate-500 mb-0.5">Full Name</p>
                        <p className="font-medium text-sm sm:text-base text-slate-900">{profile?.full_name || '—'}</p>
                      </div>
                      <div className="p-3 sm:p-4 bg-slate-50 rounded-xl">
                        <p className="text-[10px] sm:text-xs text-slate-500 mb-0.5">Email Address</p>
                        <p className="font-medium text-sm sm:text-base text-slate-900 break-all">{profile?.email || '—'}</p>
                      </div>
                      <div className="p-3 sm:p-4 bg-slate-50 rounded-xl">
                        <p className="text-[10px] sm:text-xs text-slate-500 mb-0.5">Role</p>
                        <Badge className="text-[10px] sm:text-xs bg-blue-100 text-blue-700">
                          {profile?.role || 'Staff'}
                        </Badge>
                      </div>
                      <div className="p-3 sm:p-4 bg-slate-50 rounded-xl">
                        <p className="text-[10px] sm:text-xs text-slate-500 mb-0.5">Staff ID</p>
                        <p className="font-medium text-sm sm:text-base text-slate-900 font-mono">{profile?.id?.slice(0, 8) || '—'}...</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Notifications */}
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
                    <SettingToggle icon={Mail} title="Email Notifications" description="Receive important updates via email" checked={settings.emailNotifications} onToggle={() => handleToggle('emailNotifications')} />
                    <Separator />
                    <SettingToggle icon={Bell} title="Exam Reminders" description="Get notified about upcoming exams" checked={settings.examReminders} onToggle={() => handleToggle('examReminders')} />
                    <Separator />
                    <SettingToggle icon={CheckCircle} title="Grading Alerts" description="Alerts when students submit exams for grading" checked={settings.gradingAlerts} onToggle={() => handleToggle('gradingAlerts')} />
                    <Separator />
                    <SettingToggle icon={Monitor} title="Student Activity" description="Track student login and exam activity" checked={settings.studentActivity} onToggle={() => handleToggle('studentActivity')} />
                    <Separator />
                    <SettingToggle icon={Volume2} title="Sound Effects" description="Play sounds for notifications" checked={settings.soundEnabled} onToggle={() => handleToggle('soundEnabled')} />
                  </CardContent>
                </Card>

                {/* Appearance */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-4 md:px-6">
                    <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-2">
                      <Palette className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                      Appearance
                    </CardTitle>
                    <CardDescription className="text-[10px] sm:text-xs md:text-sm">
                      Customize how the dashboard looks
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 sm:space-y-6 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
                    {/* Theme */}
                    <div>
                      <Label className="text-[11px] sm:text-xs md:text-sm font-medium mb-2 sm:mb-3 block">Theme</Label>
                      <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        <ThemeOption icon={Sun} title="Light" active={settings.theme === 'light'} onClick={() => handleSelectChange('theme', 'light')} />
                        <ThemeOption icon={Moon} title="Dark" active={settings.theme === 'dark'} onClick={() => handleSelectChange('theme', 'dark')} />
                        <ThemeOption icon={Monitor} title="System" active={settings.theme === 'system'} onClick={() => handleSelectChange('theme', 'system')} />
                      </div>
                    </div>

                    <Separator />

                    {/* Font Size */}
                    <div>
                      <Label className="text-[11px] sm:text-xs md:text-sm font-medium mb-2 sm:mb-3 block">Font Size</Label>
                      <Select value={settings.fontSize} onValueChange={(value) => handleSelectChange('fontSize', value)}>
                        <SelectTrigger className="h-8 sm:h-9 md:h-10 text-xs sm:text-sm max-w-[250px]">
                          <SelectValue placeholder="Select font size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="medium">Medium (Default)</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                        </SelectContent>
                      </Select>
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
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save All Settings
                  </Button>
                </div>
              </motion.div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}