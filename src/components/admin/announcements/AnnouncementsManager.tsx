// components/admin/announcements/AnnouncementsManager.tsx

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
  Filter, Search, RefreshCw, CheckCircle2
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
}

export function AnnouncementsManager({ profile }: AnnouncementsManagerProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterAudience, setFilterAudience] = useState<string>('all')
  
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
        // Update existing
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
        // Create new
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
        
        // Trigger notification for users
        await supabase.from('notifications').insert({
          title: `New Announcement: ${title.trim()}`,
          message: content.trim(),
          audience: audience,
          priority: priority,
          type: 'announcement',
          created_at: new Date().toISOString()
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
    
    // Calculate expires in days
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
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-blue-100 text-blue-800 border-blue-200'
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-emerald-600" />
            Announcements
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Create and manage announcements for students and staff
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Megaphone className="h-4 w-4 mr-2" />
          New Announcement
        </Button>
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={resetForm}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold">
                  {editingId ? 'Edit Announcement' : 'Create Announcement'}
                </h2>
                <Button variant="ghost" size="sm" onClick={resetForm}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <Label className="text-sm font-medium">Title *</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter announcement title"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Content *</Label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your announcement here..."
                    rows={5}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Expires After</Label>
                    <Select value={expiresIn} onValueChange={setExpiresIn}>
                      <SelectTrigger className="mt-1">
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

                  <div className="flex items-center space-x-2 pt-6">
                    <Switch checked={isPinned} onCheckedChange={setIsPinned} id="pin" />
                    <Label htmlFor="pin" className="cursor-pointer">Pin this announcement</Label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={resetForm} className="flex-1">
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateOrUpdate} 
                    disabled={isSubmitting} 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
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

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search announcements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterAudience} onValueChange={setFilterAudience}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter by audience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Audiences</SelectItem>
                <SelectItem value="students">Students Only</SelectItem>
                <SelectItem value="staff">Staff Only</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadAnnouncements}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-slate-500">Total</p>
            <p className="text-xl font-bold">{announcements.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-slate-500">Pinned</p>
            <p className="text-xl font-bold text-emerald-600">{announcements.filter(a => a.is_pinned).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-slate-500">Students</p>
            <p className="text-xl font-bold text-blue-600">{announcements.filter(a => a.audience === 'students' || a.audience === 'all').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-slate-500">Staff</p>
            <p className="text-xl font-bold text-purple-600">{announcements.filter(a => a.audience === 'staff' || a.audience === 'all').length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Announcements List */}
      <ScrollArea className="h-[calc(100vh-400px)]">
        <div className="space-y-4">
          {/* Pinned Announcements */}
          {pinnedAnnouncements.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-500 mb-3 flex items-center gap-2">
                <Pin className="h-4 w-4" /> Pinned ({pinnedAnnouncements.length})
              </h3>
              {pinnedAnnouncements.map((announcement) => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onTogglePin={handleTogglePin}
                  getPriorityColor={getPriorityColor}
                  getAudienceIcon={getAudienceIcon}
                  getAudienceLabel={getAudienceLabel}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}

          {/* Normal Announcements */}
          <div>
            {normalAnnouncements.length === 0 && pinnedAnnouncements.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Megaphone className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No announcements yet</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Click "New Announcement" to create your first announcement
                  </p>
                </CardContent>
              </Card>
            ) : (
              normalAnnouncements.map((announcement) => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onTogglePin={handleTogglePin}
                  getPriorityColor={getPriorityColor}
                  getAudienceIcon={getAudienceIcon}
                  getAudienceLabel={getAudienceLabel}
                  formatDate={formatDate}
                />
              ))
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

// Announcement Card Component
function AnnouncementCard({ 
  announcement, 
  onEdit, 
  onDelete, 
  onTogglePin,
  getPriorityColor,
  getAudienceIcon,
  getAudienceLabel,
  formatDate
}: { 
  announcement: Announcement
  onEdit: (announcement: Announcement) => void
  onDelete: (id: string) => void
  onTogglePin: (id: string, currentPinned: boolean) => void
  getPriorityColor: (priority: string) => string
  getAudienceIcon: (audience: string) => JSX.Element
  getAudienceLabel: (audience: string) => string
  formatDate: (date: string) => string
}) {
  const isExpired = announcement.expires_at && new Date(announcement.expires_at) < new Date()

  return (
    <Card className={cn(
      "mb-3 transition-all hover:shadow-md",
      announcement.priority === 'urgent' && "border-l-4 border-l-red-500",
      announcement.priority === 'high' && "border-l-4 border-l-orange-500",
      isExpired && "opacity-60"
    )}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Badge className={getPriorityColor(announcement.priority)}>
                {announcement.priority.toUpperCase()}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                {getAudienceIcon(announcement.audience)}
                {getAudienceLabel(announcement.audience)}
              </Badge>
              {announcement.is_pinned && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Pin className="h-3 w-3" /> Pinned
                </Badge>
              )}
              {isExpired && (
                <Badge variant="secondary" className="bg-red-50 text-red-600">
                  Expired
                </Badge>
              )}
            </div>
            <h3 className="font-bold text-lg">{announcement.title}</h3>
            <p className="text-slate-600 mt-2 whitespace-pre-wrap">{announcement.content}</p>
            <div className="flex items-center gap-3 mt-3 text-xs text-slate-400 flex-wrap">
              <span>By: {announcement.created_by_name || 'Admin'}</span>
              <span>📅 {formatDate(announcement.created_at)}</span>
              {announcement.expires_at && !isExpired && (
                <span>⏰ Expires: {formatDate(announcement.expires_at)}</span>
              )}
              {isExpired && (
                <span>⏰ Expired on: {formatDate(announcement.expires_at!)}</span>
              )}
            </div>
          </div>
          <div className="flex gap-1 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(announcement)}
              title="Edit"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onTogglePin(announcement.id, announcement.is_pinned)}
              title={announcement.is_pinned ? "Unpin" : "Pin"}
            >
              {announcement.is_pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(announcement.id)}
              className="text-red-600 hover:text-red-700"
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