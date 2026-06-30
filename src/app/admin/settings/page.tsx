// app/admin/settings/page.tsx

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
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Loader2, Settings, User, Shield, Bell, Palette, Database,
  Save, Camera, Key, Mail, Phone, MapPin, School,
  Globe, Lock, Eye, EyeOff, LogOut, Trash2,
  CheckCircle2, AlertTriangle, ChevronRight, Calendar,
  Wifi, HardDrive, RefreshCw, Info
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────
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

// ── Reusable section heading ───────────────────────────────────────────────────
function SectionHeader({
  icon: Icon,
  iconClass,
  title,
  description,
}: {
  icon: React.ElementType
  iconClass: string
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center shrink-0', iconClass)}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div>
        <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
      </div>
    </div>
  )
}

// ── Toggle row ─────────────────────────────────────────────────────────────────
function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

// ── Password input ─────────────────────────────────────────────────────────────
function PasswordInput({
  value,
  onChange,
  placeholder,
  show,
  onToggle,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  show: boolean
  onToggle: () => void
}) {
  return (
    <div className="relative">
      <Input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 text-sm pr-9 border-slate-200 focus-visible:ring-violet-500"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
      >
        {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────
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
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // School settings — loaded from DB
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>({
    school_name: '',
    school_motto: '',
    school_address: '',
    school_phone: '',
    school_email: '',
    current_term: '',
    current_session: '',
    portal_name: '',
  })
  const [schoolLoaded, setSchoolLoaded] = useState(false)

  // Next-term date
  const [nextTermDate, setNextTermDate] = useState('')
  const [savingNextTerm, setSavingNextTerm] = useState(false)

  // Notification prefs (loaded from DB / localStorage)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [examAlerts, setExamAlerts] = useState(true)
  const [reportCardAlerts, setReportCardAlerts] = useState(true)
  const [studentRegistrationAlerts, setStudentRegistrationAlerts] = useState(true)

  // Appearance
  const [compactMode, setCompactMode] = useState(false)
  const [showAnimations, setShowAnimations] = useState(true)

  // DB status
  const [dbConnected, setDbConnected] = useState<boolean | null>(null)

  // ── Initialise ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        // 1. Auth session
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (profileData) {
            setProfile(profileData)
            setFullName(profileData.full_name || '')
            setEmail(profileData.email || '')
            setPhone(profileData.phone || '')
            setAddress(profileData.address || '')
          }
        }

        // 2. School settings from system_settings table
        const { data: sysRows, error: sysErr } = await supabase
          .from('system_settings')
          .select('key, value')

        if (!sysErr && sysRows) {
          const map: Record<string, string> = {}
          sysRows.forEach((r: { key: string; value: string }) => { map[r.key] = r.value })

          setSchoolSettings({
            school_name: map['school_name'] || 'Vincollins College',
            school_motto: map['school_motto'] || 'Geared Towards Excellence',
            school_address: map['school_address'] || '7/9 Lawani Street, off Ishaga Rd, Surulere, Lagos',
            school_phone: map['school_phone'] || '+234 912 1155 554',
            school_email: map['school_email'] || 'vincollinscollege@gmail.com',
            current_term: map['current_term'] || 'Third Term',
            current_session: map['current_session'] || '2025/2026',
            portal_name: map['portal_name'] || 'Vincollins Portal',
          })

          if (map['next_term_date']) {
            setNextTermDate(map['next_term_date'])
          } else {
            const d = new Date()
            d.setMonth(d.getMonth() + 3)
            setNextTermDate(d.toISOString().split('T')[0])
          }

          setDbConnected(true)
        } else {
          setDbConnected(false)
        }

        setSchoolLoaded(true)

        // 3. localStorage prefs
        try {
          const stored = localStorage.getItem('admin-notification-prefs')
          if (stored) {
            const p = JSON.parse(stored)
            setEmailNotifications(p.emailNotifications ?? true)
            setExamAlerts(p.examAlerts ?? true)
            setReportCardAlerts(p.reportCardAlerts ?? true)
            setStudentRegistrationAlerts(p.studentRegistrationAlerts ?? true)
          }
          const compact = localStorage.getItem('admin-compact-mode')
          if (compact) setCompactMode(compact === 'true')
        } catch { /* ignore */ }

      } catch (err) {
        console.error('Settings init error:', err)
        setDbConnected(false)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  // ── Helpers ────────────────────────────────────────────────────────────────
  const formatDate = (d: string) => {
    if (!d) return 'Not set'
    return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const upsertSetting = async (key: string, value: string) => {
    const { error } = await supabase
      .from('system_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    if (error) throw error
  }

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!profile) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName, phone, address, updated_at: new Date().toISOString() })
        .eq('id', profile.id)
      if (error) throw error
      setProfile(p => p ? { ...p, full_name: fullName, phone, address } : p)
      toast.success('Profile updated successfully')
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile')
    } finally { setSaving(false) }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return }
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      toast.success('Password changed successfully')
      setNewPassword(''); setConfirmPassword('')
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password')
    } finally { setSaving(false) }
  }

  const handleSaveSchoolSettings = async () => {
    setSaving(true)
    try {
      const entries = Object.entries(schoolSettings) as [string, string][]
      await Promise.all(entries.map(([k, v]) => upsertSetting(k, v)))
      toast.success('School settings saved to database')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save school settings')
    } finally { setSaving(false) }
  }

  const handleSaveNextTermDate = async () => {
    if (!nextTermDate) { toast.error('Please select a date'); return }
    setSavingNextTerm(true)
    try {
      await upsertSetting('next_term_date', nextTermDate)
      toast.success('Next term date saved — will appear on all report cards')
      window.dispatchEvent(new CustomEvent('next-term-date-updated', { detail: { date: nextTermDate } }))
    } catch (err: any) {
      toast.error(err.message || 'Failed to save next term date')
    } finally { setSavingNextTerm(false) }
  }

  const handleSaveNotifications = () => {
    localStorage.setItem('admin-notification-prefs', JSON.stringify({
      emailNotifications, examAlerts, reportCardAlerts, studentRegistrationAlerts,
    }))
    toast.success('Notification preferences saved')
  }

  const handleSaveAppearance = () => {
    localStorage.setItem('admin-compact-mode', String(compactMode))
    toast.success('Appearance settings saved — reload to apply fully')
  }

  // ── Password strength ──────────────────────────────────────────────────────
  const passwordStrength = (() => {
    const l = newPassword.length
    if (l === 0) return null
    if (l < 6) return { label: 'Too short', color: 'bg-red-400', width: '25%' }
    if (l < 10) return { label: 'Fair', color: 'bg-amber-400', width: '50%' }
    if (l < 14) return { label: 'Good', color: 'bg-blue-400', width: '75%' }
    return { label: 'Strong', color: 'bg-emerald-500', width: '100%' }
  })()

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-white shadow-md flex items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-violet-600" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-slate-700">Loading settings</p>
          <p className="text-xs text-slate-400 mt-0.5">Fetching your configuration…</p>
        </div>
      </div>
    )
  }

  // ── Initials helper ────────────────────────────────────────────────────────
  const initials = profile?.full_name
    ?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'AD'

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage your profile, school configuration, and preferences
            </p>
          </div>
          <div className={cn(
            'hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border',
            dbConnected === true
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : dbConnected === false
                ? 'bg-red-50 text-red-600 border-red-200'
                : 'bg-slate-100 text-slate-500 border-slate-200'
          )}>
            <Wifi className="h-3 w-3" />
            {dbConnected === true ? 'DB Connected' : dbConnected === false ? 'DB Offline' : 'Checking…'}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Tab bar */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-1.5 shadow-sm">
            <TabsList className="w-full grid grid-cols-5 bg-transparent gap-1 h-auto">
              {[
                { value: 'profile', label: 'Profile', icon: User },
                { value: 'password', label: 'Password', icon: Key },
                { value: 'school', label: 'School', icon: School },
                { value: 'system', label: 'System', icon: Database },
                { value: 'preferences', label: 'Preferences', icon: Bell },
              ].map(tab => {
                const Icon = tab.icon
                const active = activeTab === tab.value
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={cn(
                      'flex flex-col sm:flex-row items-center gap-1 sm:gap-1.5 py-2 px-2 sm:px-3 rounded-xl text-[11px] sm:text-xs font-medium transition-all h-auto',
                      'data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-sm',
                      'data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:bg-slate-50'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden text-[9px]">{tab.label}</span>
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </div>

          {/* ── Profile ─────────────────────────────────────────────────────── */}
          <TabsContent value="profile" className="mt-4 space-y-4">
            <Card className="border border-slate-200/80 shadow-sm bg-white">
              <CardContent className="p-6">
                {/* Avatar row */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 mb-6">
                  <div className="relative shrink-0">
                    <Avatar className="h-16 w-16 ring-2 ring-white shadow-md">
                      <AvatarImage src={profile?.photo_url} />
                      <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-xl font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                      <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800">{profile?.full_name}</p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{profile?.email}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-semibold border border-violet-200">
                        <Shield className="h-2.5 w-2.5" /> Administrator
                      </span>
                    </div>
                  </div>
                </div>

                <SectionHeader
                  icon={User}
                  iconClass="bg-violet-100 text-violet-600"
                  title="Personal Information"
                  description="Update your name and contact details"
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-600">Full Name</Label>
                    <Input
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="h-9 text-sm border-slate-200 focus-visible:ring-violet-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-600">Email Address</Label>
                    <div className="relative">
                      <Input
                        value={email}
                        disabled
                        className="h-9 text-sm bg-slate-50 border-slate-200 text-slate-400 pr-8"
                      />
                      <Lock className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-300" />
                    </div>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Info className="h-3 w-3" /> Email cannot be changed here
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-600">Phone Number</Label>
                    <Input
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+234 XXX XXX XXXX"
                      className="h-9 text-sm border-slate-200 focus-visible:ring-violet-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-600">Address</Label>
                    <Input
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder="Your address"
                      className="h-9 text-sm border-slate-200 focus-visible:ring-violet-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-6 pt-4 border-t border-slate-100">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    size="sm"
                    className="bg-violet-600 hover:bg-violet-700 text-white shadow-sm h-8 text-xs px-4"
                  >
                    {saving
                      ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      : <Save className="h-3.5 w-3.5 mr-1.5" />}
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Password ─────────────────────────────────────────────────────── */}
          <TabsContent value="password" className="mt-4">
            <Card className="border border-slate-200/80 shadow-sm bg-white">
              <CardContent className="p-6">
                <SectionHeader
                  icon={Key}
                  iconClass="bg-amber-100 text-amber-600"
                  title="Change Password"
                  description="Update your account password — use a strong, unique password"
                />

                <div className="max-w-sm space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-600">New Password</Label>
                    <PasswordInput
                      value={newPassword}
                      onChange={setNewPassword}
                      placeholder="Min. 6 characters"
                      show={showNewPassword}
                      onToggle={() => setShowNewPassword(v => !v)}
                    />
                    {/* Strength bar */}
                    {passwordStrength && (
                      <div className="mt-1.5 space-y-1">
                        <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all duration-300', passwordStrength.color)}
                            style={{ width: passwordStrength.width }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400">{passwordStrength.label}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-600">Confirm Password</Label>
                    <PasswordInput
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                      placeholder="Re-enter new password"
                      show={showConfirmPassword}
                      onToggle={() => setShowConfirmPassword(v => !v)}
                    />
                    <AnimatePresence>
                      {confirmPassword && newPassword !== confirmPassword && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="text-[11px] text-red-500 flex items-center gap-1 mt-1"
                        >
                          <AlertTriangle className="h-3 w-3" /> Passwords do not match
                        </motion.p>
                      )}
                      {confirmPassword && newPassword === confirmPassword && newPassword.length >= 6 && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-[11px] text-emerald-600 flex items-center gap-1 mt-1"
                        >
                          <CheckCircle2 className="h-3 w-3" /> Passwords match
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="pt-2">
                    <Button
                      onClick={handleChangePassword}
                      disabled={saving || !newPassword || newPassword !== confirmPassword || newPassword.length < 6}
                      size="sm"
                      className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm h-8 text-xs px-4"
                    >
                      {saving
                        ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        : <Lock className="h-3.5 w-3.5 mr-1.5" />}
                      Update Password
                    </Button>
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="text-xs font-medium text-amber-700 mb-1">Security tips</p>
                  <ul className="space-y-0.5">
                    {[
                      'Use at least 8 characters',
                      'Mix uppercase, lowercase, numbers and symbols',
                      'Avoid reusing old passwords',
                    ].map(tip => (
                      <li key={tip} className="text-[11px] text-amber-600 flex items-start gap-1.5">
                        <CheckCircle2 className="h-3 w-3 mt-0.5 shrink-0" /> {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── School ───────────────────────────────────────────────────────── */}
          <TabsContent value="school" className="mt-4">
            <Card className="border border-slate-200/80 shadow-sm bg-white">
              <CardContent className="p-6">
                <SectionHeader
                  icon={School}
                  iconClass="bg-emerald-100 text-emerald-600"
                  title="School Information"
                  description="Manage school details — saved directly to the database"
                />

                {!schoolLoaded && (
                  <div className="flex items-center gap-2 mb-4 text-xs text-slate-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading from database…
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { label: 'School Name', key: 'school_name' as const, placeholder: 'e.g. Vincollins College' },
                    { label: 'School Motto', key: 'school_motto' as const, placeholder: 'e.g. Geared Towards Excellence' },
                    { label: 'Portal Name', key: 'portal_name' as const, placeholder: 'e.g. Vincollins Portal' },
                    { label: 'School Email', key: 'school_email' as const, placeholder: 'info@school.edu' },
                    { label: 'School Phone', key: 'school_phone' as const, placeholder: '+234 XXX XXX XXXX' },
                  ].map(field => (
                    <div key={field.key} className="space-y-1.5">
                      <Label className="text-xs font-medium text-slate-600">{field.label}</Label>
                      <Input
                        value={schoolSettings[field.key]}
                        onChange={e => setSchoolSettings(s => ({ ...s, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        className="h-9 text-sm border-slate-200 focus-visible:ring-emerald-500"
                      />
                    </div>
                  ))}

                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-xs font-medium text-slate-600">School Address</Label>
                    <Textarea
                      value={schoolSettings.school_address}
                      onChange={e => setSchoolSettings(s => ({ ...s, school_address: e.target.value }))}
                      rows={2}
                      className="text-sm border-slate-200 focus-visible:ring-emerald-500 resize-none"
                    />
                  </div>

                  {/* Read-only session fields */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-600">Current Term</Label>
                    <div className="relative">
                      <Input
                        value={schoolSettings.current_term}
                        onChange={e => setSchoolSettings(s => ({ ...s, current_term: e.target.value }))}
                        className="h-9 text-sm border-slate-200 focus-visible:ring-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-600">Current Session</Label>
                    <Input
                      value={schoolSettings.current_session}
                      onChange={e => setSchoolSettings(s => ({ ...s, current_session: e.target.value }))}
                      className="h-9 text-sm border-slate-200 focus-visible:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-6 pt-4 border-t border-slate-100">
                  <Button
                    onClick={handleSaveSchoolSettings}
                    disabled={saving}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm h-8 text-xs px-4"
                  >
                    {saving
                      ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      : <Save className="h-3.5 w-3.5 mr-1.5" />}
                    Save to Database
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── System ───────────────────────────────────────────────────────── */}
          <TabsContent value="system" className="mt-4 space-y-4">
            {/* Next term date */}
            <Card className="border border-slate-200/80 shadow-sm bg-white">
              <CardContent className="p-6">
                <SectionHeader
                  icon={Calendar}
                  iconClass="bg-blue-100 text-blue-600"
                  title="Next Term Resumption Date"
                  description="Appears automatically on every generated report card"
                />

                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                  <div className="space-y-1.5 flex-1 max-w-xs">
                    <Label className="text-xs font-medium text-slate-600">Select Date</Label>
                    <Input
                      type="date"
                      value={nextTermDate}
                      onChange={e => setNextTermDate(e.target.value)}
                      className="h-9 text-sm border-slate-200 focus-visible:ring-blue-500"
                    />
                  </div>
                  <Button
                    onClick={handleSaveNextTermDate}
                    disabled={savingNextTerm}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm h-9 text-xs px-4"
                  >
                    {savingNextTerm
                      ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      : <Save className="h-3.5 w-3.5 mr-1.5" />}
                    Save Date
                  </Button>
                </div>

                <AnimatePresence>
                  {nextTermDate && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-3"
                    >
                      <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-blue-800">
                          Next term begins: {formatDate(nextTermDate)}
                        </p>
                        <p className="text-xs text-blue-600 mt-0.5">
                          This date will appear on all report cards generated for the current term.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* DB status */}
            <Card className="border border-slate-200/80 shadow-sm bg-white">
              <CardContent className="p-6">
                <SectionHeader
                  icon={Database}
                  iconClass="bg-emerald-100 text-emerald-600"
                  title="Database Status"
                  description="Live connection and storage information"
                />

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className={cn(
                    'p-4 rounded-xl border',
                    dbConnected ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
                  )}>
                    <p className={cn('text-[10px] font-medium uppercase tracking-wider mb-1',
                      dbConnected ? 'text-emerald-600' : 'text-red-500')}>Connection</p>
                    <p className={cn('text-sm font-semibold flex items-center gap-1',
                      dbConnected ? 'text-emerald-700' : 'text-red-600')}>
                      {dbConnected
                        ? <><CheckCircle2 className="h-3.5 w-3.5" /> Connected</>
                        : <><AlertTriangle className="h-3.5 w-3.5" /> Offline</>}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-blue-500 mb-1">Last Sync</p>
                    <p className="text-sm font-semibold text-blue-700">
                      {new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-violet-50 border border-violet-200 col-span-2 sm:col-span-1">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-violet-500 mb-1">Provider</p>
                    <p className="text-sm font-semibold text-violet-700">Supabase</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Preferences ──────────────────────────────────────────────────── */}
          <TabsContent value="preferences" className="mt-4 space-y-4">
            {/* Notifications */}
            <Card className="border border-slate-200/80 shadow-sm bg-white">
              <CardContent className="p-6">
                <SectionHeader
                  icon={Bell}
                  iconClass="bg-blue-100 text-blue-600"
                  title="Notification Preferences"
                  description="Control which alerts you receive"
                />

                <div className="divide-y divide-slate-100">
                  <ToggleRow
                    label="Email Notifications"
                    description="Receive system alerts via email"
                    checked={emailNotifications}
                    onChange={setEmailNotifications}
                  />
                  <ToggleRow
                    label="Exam Alerts"
                    description="Notify when exams are submitted for review"
                    checked={examAlerts}
                    onChange={setExamAlerts}
                  />
                  <ToggleRow
                    label="Report Card Alerts"
                    description="Notify when report cards are ready for approval"
                    checked={reportCardAlerts}
                    onChange={setReportCardAlerts}
                  />
                  <ToggleRow
                    label="Student Registrations"
                    description="Notify when new students are registered"
                    checked={studentRegistrationAlerts}
                    onChange={setStudentRegistrationAlerts}
                  />
                </div>

                <div className="flex justify-end mt-4 pt-4 border-t border-slate-100">
                  <Button
                    onClick={handleSaveNotifications}
                    size="sm"
                    variant="outline"
                    className="border-slate-200 h-8 text-xs"
                  >
                    <Save className="h-3.5 w-3.5 mr-1.5" />Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Appearance */}
            <Card className="border border-slate-200/80 shadow-sm bg-white">
              <CardContent className="p-6">
                <SectionHeader
                  icon={Palette}
                  iconClass="bg-pink-100 text-pink-600"
                  title="Appearance"
                  description="Personalise your portal experience"
                />

                <div className="divide-y divide-slate-100">
                  <ToggleRow
                    label="Compact Mode"
                    description="Reduce spacing and font sizes across the interface"
                    checked={compactMode}
                    onChange={setCompactMode}
                  />
                  <ToggleRow
                    label="Animations"
                    description="Show page transitions and motion effects"
                    checked={showAnimations}
                    onChange={setShowAnimations}
                  />
                </div>

                <div className="flex justify-end mt-4 pt-4 border-t border-slate-100">
                  <Button
                    onClick={handleSaveAppearance}
                    size="sm"
                    variant="outline"
                    className="border-slate-200 h-8 text-xs"
                  >
                    <Save className="h-3.5 w-3.5 mr-1.5" />Save Appearance
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Danger zone */}
            <Card className="border border-red-200/80 shadow-sm bg-white">
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-5">
                  <div className="h-9 w-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-4.5 w-4.5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-red-700 text-sm">Danger Zone</h3>
                    <p className="text-xs text-red-400 mt-0.5">These actions are irreversible — proceed with caution</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      title: 'Reset All Data',
                      desc: 'Clear all exams, scores, and report cards from the system',
                    },
                    {
                      title: 'Delete Admin Account',
                      desc: 'Permanently remove your administrator account',
                    },
                  ].map(item => (
                    <div
                      key={item.title}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border border-red-100 bg-red-50/50"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 h-8 text-xs"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                        {item.title.split(' ')[0]}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}