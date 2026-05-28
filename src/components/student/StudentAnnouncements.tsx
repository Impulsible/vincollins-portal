// components/student/StudentAnnouncements.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Megaphone, Pin, Bell, Calendar, Filter, Search, 
  AlertCircle, Loader2, RefreshCw, Eye, ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Announcement {
  id: string
  title: string
  content: string
  priority: 'normal' | 'high' | 'urgent'
  is_pinned: boolean
  created_by_name: string
  created_at: string
  expires_at: string | null
}

export function StudentAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  const loadAnnouncements = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .in('audience', ['all', 'students'])
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      
      // Filter out expired announcements
      const now = new Date()
      const activeAnnouncements = (data || []).filter(a => 
        !a.expires_at || new Date(a.expires_at) > now
      )
      
      setAnnouncements(activeAnnouncements as Announcement[])
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertCircle className="h-4 w-4" />
      case 'high': return <Bell className="h-4 w-4" />
      default: return <Megaphone className="h-4 w-4" />
    }
  }

  const formatDate = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const filteredAnnouncements = announcements.filter(a => {
    if (filterPriority !== 'all' && a.priority !== filterPriority) return false
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
            Stay updated with important information from the school
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadAnnouncements}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

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
            <p className="text-xs text-slate-500">Urgent</p>
            <p className="text-xl font-bold text-red-600">{announcements.filter(a => a.priority === 'urgent').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-slate-500">High Priority</p>
            <p className="text-xl font-bold text-orange-600">{announcements.filter(a => a.priority === 'high').length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
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
        <div className="flex gap-2">
          <Button
            variant={filterPriority === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterPriority('all')}
            className={filterPriority === 'all' ? 'bg-emerald-600' : ''}
          >
            All
          </Button>
          <Button
            variant={filterPriority === 'urgent' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterPriority('urgent')}
            className={filterPriority === 'urgent' ? 'bg-red-600' : ''}
          >
            Urgent
          </Button>
          <Button
            variant={filterPriority === 'high' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterPriority('high')}
            className={filterPriority === 'high' ? 'bg-orange-600' : ''}
          >
            High
          </Button>
          <Button
            variant={filterPriority === 'normal' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterPriority('normal')}
            className={filterPriority === 'normal' ? 'bg-blue-600' : ''}
          >
            Normal
          </Button>
        </div>
      </div>

      {/* Announcements List */}
      <ScrollArea className="h-[calc(100vh-350px)]">
        {filteredAnnouncements.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Megaphone className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No announcements yet</p>
              <p className="text-sm text-slate-400 mt-1">Check back later for updates</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Pinned Announcements */}
            {pinnedAnnouncements.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-3 flex items-center gap-2">
                  <Pin className="h-4 w-4" /> Pinned ({pinnedAnnouncements.length})
                </h3>
                {pinnedAnnouncements.map((announcement, idx) => (
                  <AnnouncementCard
                    key={announcement.id}
                    announcement={announcement}
                    index={idx}
                    getPriorityColor={getPriorityColor}
                    getPriorityIcon={getPriorityIcon}
                    formatDate={formatDate}
                    onViewDetails={() => {
                      setSelectedAnnouncement(announcement)
                      setShowDetails(true)
                    }}
                  />
                ))}
              </div>
            )}

            {/* Normal Announcements */}
            <div>
              {normalAnnouncements.map((announcement, idx) => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  index={idx}
                  getPriorityColor={getPriorityColor}
                  getPriorityIcon={getPriorityIcon}
                  formatDate={formatDate}
                  onViewDetails={() => {
                    setSelectedAnnouncement(announcement)
                    setShowDetails(true)
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </ScrollArea>

      {/* Announcement Details Modal */}
      <AnimatePresence>
        {showDetails && selectedAnnouncement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {getPriorityIcon(selectedAnnouncement.priority)}
                  <h2 className="text-xl font-bold">{selectedAnnouncement.title}</h2>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowDetails(false)}>
                  ✕
                </Button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={getPriorityColor(selectedAnnouncement.priority)}>
                    {selectedAnnouncement.priority.toUpperCase()}
                  </Badge>
                  {selectedAnnouncement.is_pinned && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Pin className="h-3 w-3" /> Pinned
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <span>By: {selectedAnnouncement.created_by_name || 'Admin'}</span>
                  <span>📅 {formatDate(selectedAnnouncement.created_at)}</span>
                </div>
                <div className="border-t pt-4">
                  <p className="text-slate-700 whitespace-pre-wrap">{selectedAnnouncement.content}</p>
                </div>
                {selectedAnnouncement.expires_at && (
                  <div className="bg-amber-50 rounded-lg p-3 text-sm text-amber-700">
                    <Bell className="h-4 w-4 inline mr-2" />
                    This announcement will expire on {new Date(selectedAnnouncement.expires_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Announcement Card Component
function AnnouncementCard({ 
  announcement, 
  index,
  getPriorityColor,
  getPriorityIcon,
  formatDate,
  onViewDetails
}: { 
  announcement: Announcement
  index: number
  getPriorityColor: (priority: string) => string
  getPriorityIcon: (priority: string) => JSX.Element
  formatDate: (date: string) => string
  onViewDetails: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className={cn(
        "mb-3 transition-all hover:shadow-md cursor-pointer",
        announcement.priority === 'urgent' && "border-l-4 border-l-red-500",
        announcement.priority === 'high' && "border-l-4 border-l-orange-500",
        announcement.is_pinned && "bg-emerald-50/30"
      )}
      onClick={onViewDetails}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Badge className={getPriorityColor(announcement.priority)}>
                  {announcement.priority.toUpperCase()}
                </Badge>
                {announcement.is_pinned && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Pin className="h-3 w-3" /> Pinned
                  </Badge>
                )}
              </div>
              <h3 className="font-bold text-lg truncate">{announcement.title}</h3>
              <p className="text-slate-500 text-sm mt-1 line-clamp-2">
                {announcement.content}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                <span>By: {announcement.created_by_name || 'Admin'}</span>
                <span>📅 {formatDate(announcement.created_at)}</span>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400 shrink-0" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}