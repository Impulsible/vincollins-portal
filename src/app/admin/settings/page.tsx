// app/admin/settings/page.tsx - ADMIN SETTINGS PAGE
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  Loader2, Settings, User, Shield, Bell, Palette, Database,
  Save, Camera, Key, Mail, Phone, MapPin, School,
  Globe, Lock, Eye, EyeOff, LogOut, Trash2,
  CheckCircle2, AlertTriangle, ChevronRight
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────
interface AdminProfile {
  id: string
  full_name: string
  email: string
  phone?: string
  address?: string
  photo_url?: string
  role: string
}

interface SchoolSettings {
  school_name: string
  school_motto: string
  school_address: string
  school_phone: string
  school_email: string
  current_term: string
  current_session: string
  portal_name: string
}

// ─── Main Component ───────────────────────────────────
export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [activeTab, setActiveTab] = useState('profile')
  
  // Profile form
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  
  // Password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  
  // School settings
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>({
    school_name: 'Vincollins College',
    school_motto: 'Excellence in Education',
    school_address: 'Lagos, Nigeria',
    school_phone: '+234 800 000 0000',
    school_email: 'info@vincollins.edu.ng',
    current_term: 'Third Term',
    current_session: '2025/2026',
    portal_name: 'Vincollins Portal'
  })
  
  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [examAlerts, setExamAlerts] = useState(true)
  const [reportCardAlerts, setReportCardAlerts] = useState(true)
  const [studentRegistrationAlerts, setStudentRegistrationAlerts] = useState(true)
  
  // Appearance
  const [compactMode, setCompactMode] = useState(false)
  const [showAnimations, setShowAnimations] = useState(true)

  // ─── Init ───────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        if (data) {
          setProfile(data)
          setFullName(data.full_name || '')
          setEmail(data.email || '')
          setPhone(data.phone || '')
          setAddress(data.address || '')
        }
      }
      
      // Load saved preferences
      const storedCompact = localStorage.getItem('admin-compact-mode')
      if (storedCompact) setCompactMode(storedCompact === 'true')
      
      setLoading(false)
    }
    init()
  }, [])

  // ─── Handlers ───────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!profile) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone,
          address: address,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)
      
      if (error) throw error
      toast.success('Profile updated successfully!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile')
    } finally { setSaving(false) }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (error) throw error
      
      toast.success('Password changed successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password')
    } finally { setSaving(false) }
  }

  const handleSaveSchoolSettings = async () => {
    setSaving(true)
    try {
      // Save to a settings table or local storage
      localStorage.setItem('admin-school-settings', JSON.stringify(schoolSettings))
      toast.success('School settings saved!')
    } catch (err: any) {
      toast.error('Failed to save settings')
    } finally { setSaving(false) }
  }

  const handleSaveNotifications = () => {
    const prefs = {
      emailNotifications,
      examAlerts,
      reportCardAlerts,
      studentRegistrationAlerts
    }
    localStorage.setItem('admin-notification-prefs', JSON.stringify(prefs))
    toast.success('Notification preferences saved!')
  }

  const handleSaveAppearance = () => {
    localStorage.setItem('admin-compact-mode', String(compactMode))
    toast.success('Appearance settings saved! Reload to apply.')
  }

  // ─── Loading ────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <Settings className="h-12 w-12 text-slate-400" />
        </motion.div>
      </div>
    )
  }

  // ─── Render ─────────────────────────────────────────
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Settings className="h-5 w-5 text-slate-500" />
          Settings
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">Manage your profile, password, and preferences</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-9 w-full sm:w-auto grid grid-cols-4 sm:flex sm:flex-row gap-1">
          <TabsTrigger value="profile" className="text-xs h-7">Profile</TabsTrigger>
          <TabsTrigger value="password" className="text-xs h-7">Password</TabsTrigger>
          <TabsTrigger value="school" className="text-xs h-7">School</TabsTrigger>
          <TabsTrigger value="preferences" className="text-xs h-7">Preferences</TabsTrigger>
        </TabsList>

        {/* ─── Profile Tab ─────────────────────────── */}
        <TabsContent value="profile" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-purple-500" />
                Profile Information
              </CardTitle>
              <CardDescription className="text-xs">Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Avatar */}
              <div className="flex items-center gap-4 pb-4 border-b">
                <Avatar className="h-16 w-16 ring-2 ring-purple-100">
                  <AvatarImage src={profile?.photo_url} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-500 text-white text-lg">
                    {profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'AD'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{profile?.full_name}</p>
                  <p className="text-xs text-slate-400">{profile?.email}</p>
                  <Badge className="mt-1 text-[9px] bg-purple-100 text-purple-700">Administrator</Badge>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-xs">Full Name</Label>
                  <Input value={fullName} onChange={e => setFullName(e.target.value)} className="h-9 text-sm mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Email</Label>
                  <Input value={email} disabled className="h-9 text-sm mt-1 bg-slate-50" />
                  <p className="text-[10px] text-slate-400 mt-0.5">Email cannot be changed</p>
                </div>
                <div>
                  <Label className="text-xs">Phone Number</Label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+234 XXX XXX XXXX" className="h-9 text-sm mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Address</Label>
                  <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Your address" className="h-9 text-sm mt-1" />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={handleSaveProfile} disabled={saving} size="sm" className="bg-purple-600 hover:bg-purple-700">
                  {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Password Tab ────────────────────────── */}
        <TabsContent value="password" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Key className="h-4 w-4 text-amber-500" />
                Change Password
              </CardTitle>
              <CardDescription className="text-xs">Update your account password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-md">
              <div>
                <Label className="text-xs">New Password</Label>
                <div className="relative mt-1">
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="h-9 text-sm pr-9"
                  />
                  <button onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label className="text-xs">Confirm Password</Label>
                <div className="relative mt-1">
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="h-9 text-sm pr-9"
                  />
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Passwords do not match
                  </p>
                )}
              </div>
              <Button onClick={handleChangePassword} disabled={saving || !newPassword || newPassword !== confirmPassword} size="sm" className="bg-amber-600 hover:bg-amber-700">
                {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Lock className="h-3.5 w-3.5 mr-1.5" />}
                Update Password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── School Tab ──────────────────────────── */}
        <TabsContent value="school" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <School className="h-4 w-4 text-emerald-500" />
                School Information
              </CardTitle>
              <CardDescription className="text-xs">Manage school details and current session</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-xs">School Name</Label>
                  <Input value={schoolSettings.school_name} onChange={e => setSchoolSettings({...schoolSettings, school_name: e.target.value})} className="h-9 text-sm mt-1" />
                </div>
                <div>
                  <Label className="text-xs">School Motto</Label>
                  <Input value={schoolSettings.school_motto} onChange={e => setSchoolSettings({...schoolSettings, school_motto: e.target.value})} className="h-9 text-sm mt-1" />
                </div>
                <div>
                  <Label className="text-xs">School Address</Label>
                  <Input value={schoolSettings.school_address} onChange={e => setSchoolSettings({...schoolSettings, school_address: e.target.value})} className="h-9 text-sm mt-1" />
                </div>
                <div>
                  <Label className="text-xs">School Phone</Label>
                  <Input value={schoolSettings.school_phone} onChange={e => setSchoolSettings({...schoolSettings, school_phone: e.target.value})} className="h-9 text-sm mt-1" />
                </div>
                <div>
                  <Label className="text-xs">School Email</Label>
                  <Input value={schoolSettings.school_email} onChange={e => setSchoolSettings({...schoolSettings, school_email: e.target.value})} className="h-9 text-sm mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Portal Name</Label>
                  <Input value={schoolSettings.portal_name} onChange={e => setSchoolSettings({...schoolSettings, portal_name: e.target.value})} className="h-9 text-sm mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Current Term</Label>
                  <Input value={schoolSettings.current_term} disabled className="h-9 text-sm mt-1 bg-slate-50" />
                </div>
                <div>
                  <Label className="text-xs">Current Session</Label>
                  <Input value={schoolSettings.current_session} disabled className="h-9 text-sm mt-1 bg-slate-50" />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={handleSaveSchoolSettings} disabled={saving} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                  {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
                  Save School Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Preferences Tab ─────────────────────── */}
        <TabsContent value="preferences" className="mt-4 space-y-4">
          {/* Notifications */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4 text-blue-500" />
                Notification Preferences
              </CardTitle>
              <CardDescription className="text-xs">Control what notifications you receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'Email Notifications', desc: 'Receive email alerts', value: emailNotifications, setter: setEmailNotifications },
                { label: 'Exam Alerts', desc: 'Notify when exams are submitted', value: examAlerts, setter: setExamAlerts },
                { label: 'Report Card Alerts', desc: 'Notify when report cards are ready', value: reportCardAlerts, setter: setReportCardAlerts },
                { label: 'Student Registrations', desc: 'Notify when new students register', value: studentRegistrationAlerts, setter: setStudentRegistrationAlerts },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-slate-400">{item.desc}</p>
                  </div>
                  <Switch checked={item.value} onCheckedChange={item.setter} />
                </div>
              ))}
              <div className="flex justify-end pt-2">
                <Button onClick={handleSaveNotifications} size="sm" variant="outline" className="text-xs h-8">
                  <Save className="h-3.5 w-3.5 mr-1.5" />Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="h-4 w-4 text-pink-500" />
                Appearance
              </CardTitle>
              <CardDescription className="text-xs">Customize your portal experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'Compact Mode', desc: 'Use smaller spacing and fonts', value: compactMode, setter: setCompactMode },
                { label: 'Animations', desc: 'Show page transitions and effects', value: showAnimations, setter: setShowAnimations },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-slate-400">{item.desc}</p>
                  </div>
                  <Switch checked={item.value} onCheckedChange={item.setter} />
                </div>
              ))}
              <div className="flex justify-end pt-2">
                <Button onClick={handleSaveAppearance} size="sm" variant="outline" className="text-xs h-8">
                  <Save className="h-3.5 w-3.5 mr-1.5" />Save Appearance
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border border-red-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                Danger Zone
              </CardTitle>
              <CardDescription className="text-xs text-red-500">Irreversible actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">Reset All Data</p>
                  <p className="text-xs text-slate-400">Clear all exams, scores, and reports</p>
                </div>
                <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 text-xs h-8">
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />Reset
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">Delete Account</p>
                  <p className="text-xs text-slate-400">Permanently remove your admin account</p>
                </div>
                <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 text-xs h-8">
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}