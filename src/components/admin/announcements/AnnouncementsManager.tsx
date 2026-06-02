// components/admin/announcements/AnnouncementsManager.tsx - WITH SCROLLAREA FIX
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { 
  Loader2, Megaphone, Send, X, Pin, PinOff, Trash2, 
  Edit2, Eye, Calendar, Users, UserCheck, Bell, AlertCircle,
  Filter, Search, RefreshCw, CheckCircle2, Sparkles, ChevronRight
} from 'lucide-react'

interface Announcement {
  id: string
  title: string
  content: string
  audience: 'all' | 'students' | 'staff'
  priority: 'normal' | 'high' | 'urgent'
  is_pinned: boolean
  created_by: string
  created_by_name: string
  created_at: string
  expires_at: string | null
}

interface AnnouncementsManagerProps {
  profile: any
  hideHeader?: boolean
  className?: string
}

export function AnnouncementsManager({ profile, hideHeader = false, className }: AnnouncementsManagerProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterAudience, setFilterAudience] = useState<string>('all')
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  
  // Form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [audience, setAudience] = useState<'all' | 'students' | 'staff'>('all')
  const [priority, setPriority] = useState<'normal' | 'high' | 'urgent'>('normal')
  const [expiresIn, setExpiresIn] = useState('7')
  const [isPinned, setIsPinned] = useState(false)

  const loadAnnouncements = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setAnnouncements(data as Announcement[])
    } catch (error: any) {
      console.error('Error loading announcements:', error)
      toast.error(error.message || 'Failed to load announcements')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAnnouncements()
  }, [loadAnnouncements])

  const sendNotifications = async (announcement: { title: string; content: string; audience: string; priority: string }) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          title: `New Announcement: ${announcement.title}`,
          message: announcement.content,
          audience: announcement.audience,
          priority: announcement.priority,
          type: 'announcement',
          created_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error sending notifications:', error)
      }
    } catch (error) {
      console.error('Failed to send notifications:', error)
    }
  }

  const handleCreateOrUpdate = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in title and content')
      return
    }

    setIsSubmitting(true)
    try {
      const expiresAt = expiresIn === 'never' 
        ? null 
        : new Date(Date.now() + parseInt(expiresIn) * 24 * 60 * 60 * 1000).toISOString()

      if (editingId) {
        const { error } = await supabase
          .from('announcements')
          .update({
            title: title.trim(),
            content: content.trim(),
            audience,
            priority,
            is_pinned: isPinned,
            expires_at: expiresAt,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId)

        if (error) throw error
        toast.success('Announcement updated successfully!')
      } else {
        const { error } = await supabase
          .from('announcements')
          .insert({
            title: title.trim(),
            content: content.trim(),
            audience,
            priority,
            is_pinned: isPinned,
            expires_at: expiresAt,
            created_by: profile?.id,
            created_by_name: profile?.full_name || 'Administrator',
            created_at: new Date().toISOString()
          })

        if (error) throw error
        toast.success('Announcement published successfully!')
        
        sendNotifications({
          title: title.trim(),
          content: content.trim(),
          audience,
          priority
        })
      }

      resetForm()
      await loadAnnouncements()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save announcement')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement? This action cannot be undone.')) return
    
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Announcement deleted')
      await loadAnnouncements()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete announcement')
    }
  }

  const handleTogglePin = async (id: string, currentPinned: boolean) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ is_pinned: !currentPinned })
        .eq('id', id)

      if (error) throw error
      toast.success(currentPinned ? 'Unpinned' : 'Pinned')
      await loadAnnouncements()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update pin status')
    }
  }

  const handleEdit = (announcement: Announcement) => {
    setEditingId(announcement.id)
    setTitle(announcement.title)
    setContent(announcement.content)
    setAudience(announcement.audience)
    setPriority(announcement.priority)
    setIsPinned(announcement.is_pinned)
    
    if (announcement.expires_at) {
      const days = Math.ceil((new Date(announcement.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      setExpiresIn(days > 0 ? days.toString() : '7')
    } else {
      setExpiresIn('never')
    }
    
    setShowCreateForm(true)
  }

  const resetForm = () => {
    setEditingId(null)
    setTitle('')
    setContent('')
    setAudience('all')
    setPriority('normal')
    setExpiresIn('7')
    setIsPinned(false)
    setShowCreateForm(false)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white border-red-600'
      case 'high': return 'bg-orange-500 text-white border-orange-600'
      default: return 'bg-blue-500 text-white border-blue-600'
    }
  }

  const getPriorityBgLight = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-50 border-red-200'
      case 'high': return 'bg-orange-50 border-orange-200'
      default: return 'bg-blue-50 border-blue-200'
    }
  }

  const getAudienceIcon = (audience: string) => {
    switch (audience) {
      case 'students': return <Users className="h-3 w-3" />
      case 'staff': return <UserCheck className="h-3 w-3" />
      default: return <Users className="h-3 w-3" />
    }
  }

  const getAudienceLabel = (audience: string) => {
    switch (audience) {
      case 'students': return 'Students Only'
      case 'staff': return 'Staff Only'
      default: return 'All (Students & Staff)'
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredAnnouncements = announcements.filter(a => {
    if (filterAudience !== 'all' && a.audience !== filterAudience) return false
    if (searchQuery && !a.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !a.content.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const pinnedAnnouncements = filteredAnnouncements.filter(a => a.is_pinned)
  const normalAnnouncements = filteredAnnouncements.filter(a => !a.is_pinned)

  const audienceFilters = [
    { key: 'all', label: 'All Audiences', icon: Users },
    { key: 'students', label: 'Students Only', icon: Users },
    { key: 'staff', label: 'Staff Only', icon: UserCheck },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] sm:min-h-[400px]">
        <div className="text-center">
          <div className="relative">
            <div className="w-12 h-12 sm:w-16 sm:h-16 border-3 sm:border-4 border-emerald-200 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Megaphone className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
            </div>
          </div>
          <p className="mt-3 sm:mt-4 text-slate-600 text-sm sm:text-base font-medium">
            Loading announcements...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-5 sm:space-y-6 md:space-y-8", className)}>
      {/* Header Section - Can be hidden */}
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 flex items-center gap-2">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Megaphone className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
              </div>
              Announcements
            </h1>
            <p className="text-sm text-slate-500 mt-1 ml-0 sm:ml-12">
              Create and manage announcements for students and staff
            </p>
          </div>
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="bg-emerald-600 hover:bg-emerald-700 h-9 sm:h-10 text-sm w-full sm:w-auto"
          >
            <Megaphone className="h-4 w-4 mr-2" />
            New Announcement
          </Button>
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={resetForm}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b px-5 sm:px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold">
                  {editingId ? 'Edit Announcement' : 'Create Announcement'}
                </h2>
                <Button variant="ghost" size="sm" onClick={resetForm} className="h-8 w-8 rounded-full p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-70px)]">
                {/* Form fields - same as before */}
                <div>
                  <Label className="text-sm font-medium">Title *</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter announcement title"
                    className="mt-1.5 h-10"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Content *</Label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your announcement here..."
                    rows={5}
                    className="mt-1.5"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <Label className="text-sm font-medium">Audience</Label>
                    <RadioGroup value={audience} onValueChange={(v) => setAudience(v as any)} className="mt-2 space-y-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all" id="all" />
                        <Label htmlFor="all" className="cursor-pointer">All (Students & Staff)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="students" id="students" />
                        <Label htmlFor="students" className="cursor-pointer">Students Only</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="staff" id="staff" />
                        <Label htmlFor="staff" className="cursor-pointer">Staff Only</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Priority</Label>
                    <RadioGroup value={priority} onValueChange={(v) => setPriority(v as any)} className="mt-2 space-y-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="normal" id="normal" />
                        <Label htmlFor="normal" className="cursor-pointer">Normal</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="high" id="high" />
                        <Label htmlFor="high" className="cursor-pointer">High</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="urgent" id="urgent" />
                        <Label htmlFor="urgent" className="cursor-pointer">Urgent</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <Label className="text-sm font-medium">Expires After</Label>
                    <Select value={expiresIn} onValueChange={setExpiresIn}>
                      <SelectTrigger className="mt-1.5 h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 day</SelectItem>
                        <SelectItem value="3">3 days</SelectItem>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="14">14 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="never">Never</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-3 pt-6">
                    <Switch checked={isPinned} onCheckedChange={setIsPinned} id="pin" />
                    <Label htmlFor="pin" className="cursor-pointer">Pin this announcement</Label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={resetForm} className="flex-1 h-10">
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateOrUpdate} 
                    disabled={isSubmitting} 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-10"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        {editingId ? 'Update' : 'Publish'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-slate-50">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs text-slate-500 font-medium">Total</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-700">{announcements.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs text-emerald-600 font-medium">Pinned</p>
            <p className="text-2xl sm:text-3xl font-bold text-emerald-700">
              {announcements.filter(a => a.is_pinned).length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs text-blue-600 font-medium">Students</p>
            <p className="text-2xl sm:text-3xl font-bold text-blue-700">
              {announcements.filter(a => a.audience === 'students' || a.audience === 'all').length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs text-purple-600 font-medium">Staff</p>
            <p className="text-2xl sm:text-3xl font-bold text-purple-700">
              {announcements.filter(a => a.audience === 'staff' || a.audience === 'all').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Section */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search announcements by title or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 text-sm"
              />
            </div>
            
            {/* Desktop Filter */}
            <div className="hidden sm:flex gap-2">
              {audienceFilters.map((filter) => (
                <Button
                  key={filter.key}
                  variant={filterAudience === filter.key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterAudience(filter.key)}
                  className={cn(
                    "h-9 px-4 text-sm",
                    filterAudience === filter.key && "bg-emerald-600 text-white"
                  )}
                >
                  <filter.icon className="h-3.5 w-3.5 mr-1.5" />
                  {filter.label}
                </Button>
              ))}
              <Button variant="outline" size="sm" onClick={loadAnnouncements} className="h-9 px-4">
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Refresh
              </Button>
            </div>

            {/* Mobile Filter */}
            <div className="sm:hidden relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                className="w-full h-9 justify-between"
              >
                <span className="flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5" />
                  {audienceFilters.find(f => f.key === filterAudience)?.label || 'Filter'}
                </span>
                <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", mobileFilterOpen && "rotate-90")} />
              </Button>
              
              <AnimatePresence>
                {mobileFilterOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-slate-100 p-2 z-10"
                  >
                    {audienceFilters.map((filter) => (
                      <button
                        key={filter.key}
                        onClick={() => {
                          setFilterAudience(filter.key)
                          setMobileFilterOpen(false)
                        }}
                        className={cn(
                          "w-full px-3 py-2 rounded-lg text-sm text-left transition-all",
                          filterAudience === filter.key 
                            ? "bg-emerald-50 text-emerald-700 font-medium" 
                            : "text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        <filter.icon className="h-3.5 w-3.5 inline mr-2" />
                        {filter.label}
                      </button>
                    ))}
                    <div className="border-t my-1" />
                    <button
                      onClick={() => {
                        loadAnnouncements()
                        setMobileFilterOpen(false)
                      }}
                      className="w-full px-3 py-2 rounded-lg text-sm text-left text-slate-600 hover:bg-slate-50"
                    >
                      <RefreshCw className="h-3.5 w-3.5 inline mr-2" />
                      Refresh
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ✅ Announcements List - WRAPPED with relative positioning to fix ScrollArea warning */}
      <div className="relative w-full">
        <ScrollArea className="h-[calc(100vh-480px)] sm:h-[calc(100vh-520px)] lg:h-[calc(100vh-560px)]">
          <div className="space-y-4 sm:space-y-5 pb-4">
            {/* Pinned Announcements */}
            {pinnedAnnouncements.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <div className="h-6 w-6 rounded-full bg-amber-100 flex items-center justify-center">
                    <Pin className="h-3 w-3 text-amber-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-600">Pinned Announcements</h3>
                  <Badge className="bg-amber-100 text-amber-700 text-xs">{pinnedAnnouncements.length}</Badge>
                </div>
                {pinnedAnnouncements.map((announcement) => (
                  <AnnouncementCard
                    key={announcement.id}
                    announcement={announcement}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onTogglePin={handleTogglePin}
                    getPriorityBgLight={getPriorityBgLight}
                    getAudienceIcon={getAudienceIcon}
                    getAudienceLabel={getAudienceLabel}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            )}

            {/* Recent Announcements */}
            <div>
              {normalAnnouncements.length === 0 && pinnedAnnouncements.length === 0 ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="text-center py-12 sm:py-16">
                    <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                      <Megaphone className="h-8 w-8 text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-medium">No announcements yet</p>
                    <p className="text-sm text-slate-400 mt-1">
                      Click "New Announcement" to create your first announcement
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Sparkles className="h-3 w-3 text-emerald-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-600">Recent Announcements</h3>
                    <Badge className="bg-emerald-100 text-emerald-700 text-xs">{normalAnnouncements.length}</Badge>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    {normalAnnouncements.map((announcement) => (
                      <AnnouncementCard
                        key={announcement.id}
                        announcement={announcement}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onTogglePin={handleTogglePin}
                        getPriorityBgLight={getPriorityBgLight}
                        getAudienceIcon={getAudienceIcon}
                        getAudienceLabel={getAudienceLabel}
                        formatDate={formatDate}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

// Announcement Card Component
function AnnouncementCard({ 
  announcement, 
  onEdit, 
  onDelete, 
  onTogglePin,
  getPriorityBgLight,
  getAudienceIcon,
  getAudienceLabel,
  formatDate
}: { 
  announcement: Announcement
  onEdit: (announcement: Announcement) => void
  onDelete: (id: string) => void
  onTogglePin: (id: string, currentPinned: boolean) => void
  getPriorityBgLight: (priority: string) => string
  getAudienceIcon: (audience: string) => JSX.Element
  getAudienceLabel: (audience: string) => string
  formatDate: (date: string) => string
}) {
  const isExpired = announcement.expires_at && new Date(announcement.expires_at) < new Date()
  const priorityBgLight = getPriorityBgLight(announcement.priority)

  return (
    <Card className={cn(
      "group transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border",
      priorityBgLight,
      announcement.is_pinned && "border-amber-200 shadow-sm",
      isExpired && "opacity-60"
    )}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge className={cn(
                "text-xs px-2 py-0.5",
                announcement.priority === 'urgent' ? "bg-red-500 text-white" :
                announcement.priority === 'high' ? "bg-orange-500 text-white" : "bg-blue-500 text-white"
              )}>
                {announcement.priority.toUpperCase()}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1 text-xs">
                {getAudienceIcon(announcement.audience)}
                {getAudienceLabel(announcement.audience)}
              </Badge>
              {announcement.is_pinned && (
                <Badge variant="secondary" className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700">
                  <Pin className="h-3 w-3" /> Pinned
                </Badge>
              )}
              {isExpired && (
                <Badge variant="secondary" className="bg-red-50 text-red-600 text-xs">
                  Expired
                </Badge>
              )}
            </div>
            <h3 className="font-bold text-slate-800 text-base sm:text-lg">
              {announcement.title}
            </h3>
            <p className="text-slate-600 text-sm mt-2 line-clamp-2">
              {announcement.content}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-400">
              <span>By: {announcement.created_by_name || 'Administrator'}</span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(announcement.created_at)}
              </span>
              {announcement.expires_at && !isExpired && (
                <span>Expires: {formatDate(announcement.expires_at)}</span>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(announcement)}
              className="h-8 w-8 p-0"
              title="Edit"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onTogglePin(announcement.id, announcement.is_pinned)}
              className="h-8 w-8 p-0"
              title={announcement.is_pinned ? "Unpin" : "Pin"}
            >
              {announcement.is_pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(announcement.id)}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}