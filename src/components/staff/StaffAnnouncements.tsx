// components/staff/StaffAnnouncements.tsx - COMPLETE FIXED VERSION
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
  AlertCircle, Loader2, RefreshCw, ChevronRight, 
  Sparkles, X
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

interface StaffAnnouncementsProps {
  hideHeader?: boolean
  className?: string
}

export function StaffAnnouncements({ hideHeader = false, className }: StaffAnnouncementsProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  const loadAnnouncements = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .in('audience', ['all', 'staff'])
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      
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

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      case 'high': return <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      default: return <Megaphone className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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

  const priorityFilters = [
    { key: 'all', label: 'All', color: 'bg-emerald-600' },
    { key: 'urgent', label: 'Urgent', color: 'bg-red-600' },
    { key: 'high', label: 'High', color: 'bg-orange-600' },
    { key: 'normal', label: 'Normal', color: 'bg-blue-600' },
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
              Stay updated with important information from the administration
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadAnnouncements}
            className="h-9 sm:h-10 text-sm w-full sm:w-auto border-slate-200 hover:border-emerald-300 hover:bg-emerald-50"
          >
            <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
            Refresh
          </Button>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-slate-50 hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs text-slate-500 font-medium">Total</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-700">{announcements.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-white hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs text-emerald-600 font-medium">Pinned</p>
            <p className="text-2xl sm:text-3xl font-bold text-emerald-700">
              {announcements.filter(a => a.is_pinned).length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-red-50 to-white hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs text-red-600 font-medium">Urgent</p>
            <p className="text-2xl sm:text-3xl font-bold text-red-700">
              {announcements.filter(a => a.priority === 'urgent').length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-white hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs text-orange-600 font-medium">High Priority</p>
            <p className="text-2xl sm:text-3xl font-bold text-orange-700">
              {announcements.filter(a => a.priority === 'high').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Section */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search announcements by title or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 sm:h-11 text-sm border-slate-200 focus:border-emerald-300 focus:ring-emerald-200"
          />
        </div>
        
        {/* Desktop Filters */}
        <div className="hidden sm:flex gap-2">
          {priorityFilters.map((filter) => (
            <Button
              key={filter.key}
              variant={filterPriority === filter.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterPriority(filter.key)}
              className={cn(
                "h-9 px-4 text-sm font-medium transition-all",
                filterPriority === filter.key 
                  ? filter.color + " text-white shadow-md hover:opacity-90" 
                  : "border-slate-200 hover:border-emerald-300 hover:bg-emerald-50"
              )}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        {/* Mobile Filter */}
        <div className="sm:hidden relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="w-full h-9 justify-between border-slate-200"
          >
            <span className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5" />
              Filter: {priorityFilters.find(f => f.key === filterPriority)?.label || 'All'}
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
                <div className="grid grid-cols-2 gap-1">
                  {priorityFilters.map((filter) => (
                    <button
                      key={filter.key}
                      onClick={() => {
                        setFilterPriority(filter.key)
                        setMobileFilterOpen(false)
                      }}
                      className={cn(
                        "px-3 py-2 rounded-lg text-sm text-left transition-all",
                        filterPriority === filter.key 
                          ? "bg-emerald-50 text-emerald-700 font-medium" 
                          : "text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ✅ Announcements List - WRAPPED with relative positioning */}
      <div className="relative w-full">
        <ScrollArea className="h-[calc(100vh-480px)] sm:h-[calc(100vh-520px)] lg:h-[calc(100vh-560px)]">
          {filteredAnnouncements.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="text-center py-12 sm:py-16">
                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Megaphone className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">No announcements found</p>
                <p className="text-sm text-slate-400 mt-1">
                  {searchQuery ? `No results matching "${searchQuery}"` : 'Check back later for updates'}
                </p>
                {searchQuery && (
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={() => setSearchQuery('')}
                    className="mt-3 text-emerald-600"
                  >
                    Clear search
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
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
                  {pinnedAnnouncements.map((announcement, idx) => (
                    <AnnouncementCard
                      key={announcement.id}
                      announcement={announcement}
                      index={idx}
                      getPriorityBgLight={getPriorityBgLight}
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

              {/* Recent Announcements */}
              <div>
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Sparkles className="h-3 w-3 text-emerald-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-600">Recent Announcements</h3>
                  <Badge className="bg-emerald-100 text-emerald-700 text-xs">{normalAnnouncements.length}</Badge>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  {normalAnnouncements.map((announcement, idx) => (
                    <AnnouncementCard
                      key={announcement.id}
                      announcement={announcement}
                      index={idx}
                      getPriorityBgLight={getPriorityBgLight}
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
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Announcement Details Modal */}
      <AnimatePresence>
        {showDetails && selectedAnnouncement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-[90%] sm:max-w-lg md:max-w-2xl max-h-[85vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b px-5 sm:px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center",
                    selectedAnnouncement.priority === 'urgent' ? "bg-red-100" :
                    selectedAnnouncement.priority === 'high' ? "bg-orange-100" : "bg-blue-100"
                  )}>
                    {getPriorityIcon(selectedAnnouncement.priority)}
                  </div>
                  <h2 className="font-bold text-lg sm:text-xl truncate text-slate-800">
                    {selectedAnnouncement.title}
                  </h2>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowDetails(false)}
                  className="h-8 w-8 rounded-full hover:bg-slate-100 p-0"
                >
                  <X className="h-4 w-4 text-slate-500" />
                </Button>
              </div>
              
              <div className="p-5 sm:p-6 space-y-4 overflow-y-auto max-h-[calc(85vh-70px)]">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={cn(
                    getPriorityColor(selectedAnnouncement.priority),
                    "text-xs px-2 py-0.5"
                  )}>
                    {selectedAnnouncement.priority.toUpperCase()}
                  </Badge>
                  {selectedAnnouncement.is_pinned && (
                    <Badge variant="secondary" className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700">
                      <Pin className="h-3 w-3" /> Pinned
                    </Badge>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="font-medium">By:</span> {selectedAnnouncement.created_by_name || 'Administrator'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(selectedAnnouncement.created_at)}
                  </span>
                </div>
                
                <div className="border-t pt-4">
                  <p className="text-slate-700 text-sm sm:text-base whitespace-pre-wrap leading-relaxed">
                    {selectedAnnouncement.content}
                  </p>
                </div>
                
                {selectedAnnouncement.expires_at && (
                  <div className="bg-amber-50 rounded-xl p-3 text-sm text-amber-700 border border-amber-200">
                    <Bell className="h-4 w-4 inline mr-2" />
                    This announcement will expire on {new Date(selectedAnnouncement.expires_at).toLocaleDateString('en-NG', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
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
  getPriorityBgLight,
  getPriorityIcon,
  formatDate,
  onViewDetails
}: { 
  announcement: Announcement
  index: number
  getPriorityBgLight: (priority: string) => string
  getPriorityIcon: (priority: string) => JSX.Element
  formatDate: (date: string) => string
  onViewDetails: () => void
}) {
  const priorityBgLight = getPriorityBgLight(announcement.priority)
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card 
        className={cn(
          "group cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border",
          priorityBgLight,
          announcement.is_pinned && "border-amber-200 shadow-sm"
        )}
        onClick={onViewDetails}
      >
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors group-hover:scale-105",
              announcement.priority === 'urgent' ? "bg-red-100 text-red-600" :
              announcement.priority === 'high' ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"
            )}>
              {getPriorityIcon(announcement.priority)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <h3 className="font-semibold text-slate-800 text-sm sm:text-base">
                  {announcement.title}
                </h3>
                {announcement.is_pinned && (
                  <Pin className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                )}
              </div>
              <p className="text-slate-500 text-xs sm:text-sm line-clamp-2">
                {announcement.content}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                <span>By: {announcement.created_by_name || 'Administrator'}</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(announcement.created_at)}
                </span>
              </div>
            </div>
            
            <ChevronRight className="h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}