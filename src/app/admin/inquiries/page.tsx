// app/admin/inquiries/page.tsx - FULL DARK MODE
'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Loader2, Search, Eye, CheckCircle, RefreshCw,
  Mail, User, Calendar, MessageSquare, Phone, GraduationCap,
  Trash2, Home, ChevronRight, Clock, AlertCircle, Building,
  XCircle, Download, FileSpreadsheet, Filter, ChevronDown,
  Reply, ExternalLink, MoreHorizontal, Send, ChevronLeft,
  ChevronRightIcon, FileText, CheckCheck, Archive, ArrowUpDown
} from 'lucide-react'
import Link from 'next/link'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
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

// ─── Types ────────────────────────────────────────────
interface AdmissionApplication {
  id: string
  first_name: string
  middle_name?: string
  last_name: string
  email: string
  phone: string
  date_of_birth?: string
  gender?: string
  applying_for_class: string
  current_school?: string
  parent_name: string
  parent_phone: string
  parent_email?: string
  address?: string
  city?: string
  state?: string
  country?: string
  medical_conditions?: string
  how_did_you_hear?: string
  additional_notes?: string
  status: string
  created_at: string
  reviewed_at?: string
  admin_notes?: string
}

interface ContactInquiry {
  id: string
  name: string
  email: string
  phone?: string
  vin_id?: string
  student_class?: string
  admission_year?: string
  subject: string
  message: string
  inquiry_type: string
  is_urgent: boolean
  status: string
  created_at: string
  admin_notes?: string
}

type TableType = 'admission_applications' | 'contact_inquiries'

const ITEMS_PER_PAGE = 15

export default function AdminInquiriesPage() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [admissions, setAdmissions] = useState<AdmissionApplication[]>([])
  const [contacts, setContacts] = useState<ContactInquiry[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('admissions')
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{ id: string; table: string } | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [processing, setProcessing] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [exporting, setExporting] = useState(false)
  const [replyDialog, setReplyDialog] = useState(false)
  const [replySubject, setReplySubject] = useState('')
  const [replyBody, setReplyBody] = useState('')

  // Filters
  const [admissionStatusFilter, setAdmissionStatusFilter] = useState('all')
  const [contactStatusFilter, setContactStatusFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')

  // Pagination
  const [admissionPage, setAdmissionPage] = useState(1)
  const [contactPage, setContactPage] = useState(1)

  // Stats
  const [admissionStats, setAdmissionStats] = useState({ total: 0, pending: 0, reviewed: 0, approved: 0, rejected: 0 })
  const [contactStats, setContactStats] = useState({ total: 0, unread: 0, read: 0, resolved: 0, urgent: 0 })

  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
    loadProfile()
    loadAllData()
  }, [])

  // Reset page when tab changes or filters change
  useEffect(() => {
    setAdmissionPage(1)
    setContactPage(1)
  }, [activeTab, admissionStatusFilter, contactStatusFilter, searchQuery])

  const loadProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { window.location.href = '/portal'; return }
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    if (data) setProfile(data)
  }

  const loadAllData = async () => {
    setLoading(true)
    try {
      const [admissionResult, contactResult] = await Promise.all([
        supabase.from('admission_applications').select('*').order('created_at', { ascending: false }),
        supabase.from('contact_inquiries').select('*').order('created_at', { ascending: false })
      ])

      const admList = (admissionResult.data as AdmissionApplication[]) || []
      setAdmissions(admList)
      setAdmissionStats({
        total: admList.length,
        pending: admList.filter(a => a.status === 'pending').length,
        reviewed: admList.filter(a => a.status === 'reviewed').length,
        approved: admList.filter(a => a.status === 'approved').length,
        rejected: admList.filter(a => a.status === 'rejected').length,
      })

      const conList = (contactResult.data as ContactInquiry[]) || []
      setContacts(conList)
      setContactStats({
        total: conList.length,
        unread: conList.filter(c => c.status === 'unread').length,
        read: conList.filter(c => c.status === 'read').length,
        resolved: conList.filter(c => c.status === 'resolved').length,
        urgent: conList.filter(c => c.is_urgent).length,
      })
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (id: string, status: string, table: string) => {
    setProcessing(true)
    try {
      const updateData: any = { status, admin_notes: adminNotes }
      if (status === 'reviewed' || status === 'read') updateData.reviewed_at = new Date().toISOString()

      const { error } = await supabase.from(table).update(updateData).eq('id', id)
      if (error) throw error

      toast.success(`Updated to ${status}`)
      setShowDialog(false)
      setAdminNotes('')
      await loadAllData()
    } catch (error) {
      console.error('Update error:', error)
      toast.error('Failed to update')
    } finally {
      setProcessing(false)
    }
  }

  const handleDelete = async (id: string, table: string) => {
    setProcessing(true)
    try {
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) throw error
      toast.success('Deleted successfully')
      setShowDeleteAlert(false)
      setItemToDelete(null)
      await loadAllData()
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete')
    } finally {
      setProcessing(false)
    }
  }

  // ─── Reply via Email ────────────────────────────────
  const openReplyDialog = (item: any) => {
    const name = item.first_name ? getFullName(item) : item.name
    const subject = item.subject || `${name} - Admission Application`
    setReplySubject(`Re: ${subject}`)
    setReplyBody(`Dear ${name},\n\nThank you for contacting Vincollis College.\n\n`)
    setReplyDialog(true)
  }

  const handleReplyViaEmail = () => {
    if (!selectedItem) return
    const mailtoLink = `mailto:${selectedItem.email}?subject=${encodeURIComponent(replySubject)}&body=${encodeURIComponent(replyBody)}`
    window.open(mailtoLink, '_blank')
    setReplyDialog(false)
  }

  const handleQuickReply = (email: string, subject: string) => {
    window.location.href = `mailto:${email}?subject=Re: ${encodeURIComponent(subject)}`
  }

  // ─── Export to CSV ──────────────────────────────────
  const convertToCSV = (data: any[], fields: string[]): string => {
    const header = fields.join(',')
    const rows = data.map(item =>
      fields.map(field => {
        let value = item[field] || ''
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          value = `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )
    return [header, ...rows].join('\n')
  }

  const handleExport = async (type: 'admissions' | 'contacts') => {
    setExporting(true)
    try {
      const data = type === 'admissions' ? filteredAdmissions : filteredContacts
      const fields = type === 'admissions'
        ? ['first_name', 'middle_name', 'last_name', 'email', 'phone', 'applying_for_class', 'parent_name', 'parent_phone', 'status', 'created_at']
        : ['name', 'email', 'phone', 'subject', 'message', 'inquiry_type', 'status', 'is_urgent', 'created_at']

      const csv = convertToCSV(data, fields)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success(`${data.length} ${type} exported to CSV`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export')
    } finally {
      setExporting(false)
    }
  }

  // ─── Bulk Actions ───────────────────────────────────
  const handleBulkStatusUpdate = async (type: TableType, status: string) => {
    const data = type === 'admission_applications' ? filteredAdmissions : filteredContacts
    const targetStatuses = type === 'admission_applications'
      ? (status === 'read' ? ['pending'] : ['pending', 'reviewed'])
      : (status === 'read' ? ['unread'] : ['unread', 'read'])

    const itemsToUpdate = data.filter(item => targetStatuses.includes(item.status))
    if (itemsToUpdate.length === 0) {
      toast.info('No items to update')
      return
    }

    setProcessing(true)
    try {
      const { error } = await supabase
        .from(type)
        .update({ status })
        .in('id', itemsToUpdate.map(i => i.id))

      if (error) throw error
      toast.success(`${itemsToUpdate.length} items updated to ${status}`)
      await loadAllData()
    } catch (error) {
      console.error('Bulk update error:', error)
      toast.error('Failed to update items')
    } finally {
      setProcessing(false)
    }
  }

  // ─── Helpers ────────────────────────────────────────
  const getAdmissionStatusBadge = (status: string) => {
    const configs: Record<string, { className: string; icon: any; label: string }> = {
      pending: { className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30', icon: Clock, label: 'Pending' },
      reviewed: { className: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30', icon: Eye, label: 'Reviewed' },
      approved: { className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30', icon: CheckCircle, label: 'Approved' },
      rejected: { className: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30', icon: XCircle, label: 'Rejected' }
    }
    const config = configs[status] || configs.pending
    const IconComponent = config.icon
    return <Badge variant="outline" className={`${config.className} text-[11px] flex items-center gap-1 border`}><IconComponent className="h-3 w-3" />{config.label}</Badge>
  }

  const getContactStatusBadge = (status: string) => {
    const configs: Record<string, { className: string; icon: any; label: string }> = {
      unread: { className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30', icon: Clock, label: 'Unread' },
      read: { className: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30', icon: Eye, label: 'Read' },
      resolved: { className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30', icon: CheckCircle, label: 'Resolved' }
    }
    const config = configs[status] || configs.unread
    const IconComponent = config.icon
    return <Badge variant="outline" className={`${config.className} text-[11px] flex items-center gap-1 border`}><IconComponent className="h-3 w-3" />{config.label}</Badge>
  }

  const getInquiryTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      general: 'General Inquiry', admission: 'Admission Question',
      academic: 'Academic Programs', technical: 'Technical Support',
      billing: 'Billing/Payments', feedback: 'Feedback',
      forgot_vin: 'Forgot VIN ID', forgot_email: 'Forgot Email',
      forgot_both: 'Forgot Login Details', other: 'Other'
    }
    return labels[type] || type
  }

  const formatDate = (d: string): string => {
    if (!d) return ''
    const date = new Date(d)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
  }

  const getFullName = (item: any): string => {
    if (item.first_name) {
      return [item.first_name, item.middle_name, item.last_name].filter(Boolean).join(' ')
    }
    return item.name || 'Unknown'
  }

  // ─── Filtered Data ──────────────────────────────────
  const filteredAdmissions = admissions.filter(a => {
    const q = searchQuery.toLowerCase()
    const fullName = getFullName(a).toLowerCase()
    const matchesSearch = fullName.includes(q) || a.email?.toLowerCase().includes(q) || a.phone?.includes(q) || a.parent_name?.toLowerCase().includes(q)
    const matchesStatus = admissionStatusFilter === 'all' || a.status === admissionStatusFilter
    return matchesSearch && matchesStatus
  })

  const filteredContacts = contacts.filter(c => {
    const q = searchQuery.toLowerCase()
    const matchesSearch = c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.subject?.toLowerCase().includes(q) || c.message?.toLowerCase().includes(q)
    const matchesStatus = contactStatusFilter === 'all' || c.status === contactStatusFilter
    return matchesSearch && matchesStatus
  })

  // Sort
  const sortData = <T extends { created_at: string }>(data: T[]): T[] => {
    return [...data].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
    })
  }

  const sortedAdmissions = sortData(filteredAdmissions)
  const sortedContacts = sortData(filteredContacts)

  // Paginate
  const paginatedAdmissions = sortedAdmissions.slice((admissionPage - 1) * ITEMS_PER_PAGE, admissionPage * ITEMS_PER_PAGE)
  const paginatedContacts = sortedContacts.slice((contactPage - 1) * ITEMS_PER_PAGE, contactPage * ITEMS_PER_PAGE)

  const totalAdmissionPages = Math.ceil(sortedAdmissions.length / ITEMS_PER_PAGE)
  const totalContactPages = Math.ceil(sortedContacts.length / ITEMS_PER_PAGE)

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="text-center">
          <div className="relative mx-auto mb-6 h-16 w-16">
            <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin" />
            <MessageSquare className="absolute inset-0 m-auto h-6 w-6 text-purple-500 dark:text-purple-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-1">Loading Inquiries</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Please wait while we fetch your data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-4 sm:space-y-6 transition-colors duration-300" suppressHydrationWarning>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
        <Link href="/admin" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center gap-1">
          <Home className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        <span className="text-slate-800 dark:text-slate-200 font-medium">Inquiries</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-200 dark:shadow-purple-900/40">
            <Building className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Inquiries Management</h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {admissionStats.total + contactStats.total} total • {admissionStats.total} admissions • {contactStats.total} contacts
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadAllData} className="h-9 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Refresh
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800">
                <Download className="h-3.5 w-3.5 mr-1.5" />Export
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="dark:bg-slate-900 dark:border-slate-800">
              <DropdownMenuItem onClick={() => handleExport('admissions')} disabled={exporting} className="dark:focus:bg-slate-800">
                <FileSpreadsheet className="h-4 w-4 mr-2" />Export Admissions CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('contacts')} disabled={exporting} className="dark:focus:bg-slate-800">
                <FileSpreadsheet className="h-4 w-4 mr-2" />Export Contacts CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 h-auto w-full sm:w-auto shadow-sm">
          <TabsTrigger value="admissions" className="text-xs sm:text-sm px-4 py-2 rounded-lg data-[state=active]:bg-purple-600 data-[state=active]:text-white dark:data-[state=active]:bg-purple-600 dark:text-slate-300">
            <GraduationCap className="h-4 w-4 mr-1.5" />
            Admissions
            <Badge className="ml-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 data-[state=active]:bg-white/20 data-[state=active]:text-inherit text-[10px]">{admissionStats.total}</Badge>
          </TabsTrigger>
          <TabsTrigger value="contacts" className="text-xs sm:text-sm px-4 py-2 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:data-[state=active]:bg-blue-600 dark:text-slate-300">
            <MessageSquare className="h-4 w-4 mr-1.5" />
            Contact
            <Badge className="ml-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 data-[state=active]:bg-white/20 data-[state=active]:text-inherit text-[10px]">{contactStats.total}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* ─── ADMISSIONS TAB ─── */}
        <TabsContent value="admissions" className="mt-4 space-y-4 outline-none">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
            {[
              { label: 'Total', value: admissionStats.total, className: 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800' },
              { label: 'Pending', value: admissionStats.pending, className: 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20', labelColor: 'text-amber-600 dark:text-amber-400', valueColor: 'text-amber-700 dark:text-amber-300' },
              { label: 'Reviewed', value: admissionStats.reviewed, className: 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20', labelColor: 'text-blue-600 dark:text-blue-400', valueColor: 'text-blue-700 dark:text-blue-300' },
              { label: 'Approved', value: admissionStats.approved, className: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20', labelColor: 'text-emerald-600 dark:text-emerald-400', valueColor: 'text-emerald-700 dark:text-emerald-300' },
              { label: 'Rejected', value: admissionStats.rejected, className: 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20', labelColor: 'text-red-500 dark:text-red-400', valueColor: 'text-red-600 dark:text-red-300' },
            ].map((stat, i) => (
              <Card key={i} className={`shadow-sm transition-all hover:shadow-md ${stat.className}`}>
                <CardContent className="p-3 text-center">
                  <p className={`text-[11px] font-medium uppercase tracking-wider ${stat.labelColor || 'text-slate-500 dark:text-slate-400'}`}>{stat.label}</p>
                  <motion.p 
                    key={stat.value}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className={`text-xl sm:text-2xl font-bold mt-1 ${stat.valueColor || 'text-slate-900 dark:text-slate-100'}`}
                  >
                    {stat.value}
                  </motion.p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters & Search */}
          <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                ref={searchInputRef}
                placeholder="Search admissions... (Ctrl+K)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-10 text-sm bg-slate-50 dark:bg-slate-800/60 dark:border-slate-700 dark:text-white"
              />
            </div>
            <div className="flex gap-2">
              <Select value={admissionStatusFilter} onValueChange={setAdmissionStatusFilter}>
                <SelectTrigger className="w-[130px] h-10 text-xs dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-200">
                  <Filter className="h-3.5 w-3.5 mr-1" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as 'newest' | 'oldest')}>
                <SelectTrigger className="w-[120px] h-10 text-xs dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-200">
                  <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                </SelectContent>
              </Select>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-10 w-10 p-0 dark:bg-slate-800/60 dark:border-slate-700 dark:hover:bg-slate-800">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="dark:bg-slate-900 dark:border-slate-800">
                  <DropdownMenuItem onClick={() => handleBulkStatusUpdate('admission_applications', 'reviewed')} disabled={processing} className="dark:focus:bg-slate-800">
                    <Eye className="h-4 w-4 mr-2" />Mark All as Reviewed
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusUpdate('admission_applications', 'approved')} disabled={processing} className="dark:focus:bg-slate-800">
                    <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" />Approve All Pending
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <p className="text-xs text-slate-500 dark:text-slate-400 px-1">
            Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{paginatedAdmissions.length}</span> of {sortedAdmissions.length} applications
          </p>

          {/* Admissions List */}
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden rounded-2xl">
            <CardContent className="p-0">
              <AnimatePresence mode="wait">
                {paginatedAdmissions.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16 px-4"
                  >
                    <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                      <GraduationCap className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No applications found</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">There are no admission applications matching your criteria.</p>
                    {admissionStatusFilter !== 'all' && (
                      <Button variant="outline" size="sm" onClick={() => setAdmissionStatusFilter('all')} className="dark:bg-slate-800 dark:border-slate-700">Clear filter</Button>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="divide-y divide-slate-100 dark:divide-slate-800/60"
                  >
                    {paginatedAdmissions.map((app, index) => (
                      <motion.div
                        key={app.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">{getFullName(app)}</h3>
                              {getAdmissionStatusBadge(app.status)}
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mb-2 flex-wrap">
                              <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{app.email}</span>
                              <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{app.phone}</span>
                              <span className="flex items-center gap-1" suppressHydrationWarning><Calendar className="h-3 w-3" />{formatDate(app.created_at)}</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              <Badge variant="secondary" className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">Class: {app.applying_for_class}</Badge>
                              <Badge variant="secondary" className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">Parent: {app.parent_name}</Badge>
                              {app.current_school && <Badge variant="secondary" className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">{app.current_school}</Badge>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleQuickReply(app.email, `Admission Application - ${getFullName(app)}`)}
                              className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-slate-800"
                              title="Reply via email"
                            >
                              <Reply className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { setSelectedItem({ ...app, _table: 'admission_applications' }); setAdminNotes(app.admin_notes || ''); setShowDialog(true) }}
                              className="h-8 px-2 text-xs text-slate-600 hover:text-purple-600 dark:text-slate-300 dark:hover:text-purple-400 dark:hover:bg-slate-800"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" /> View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { setItemToDelete({ id: app.id, table: 'admission_applications' }); setShowDeleteAlert(true) }}
                              className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:text-slate-500 dark:hover:text-red-400 dark:hover:bg-red-500/10"
                              title="Delete Application"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalAdmissionPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setAdmissionPage(p => Math.max(1, p - 1))} disabled={admissionPage === 1} className="dark:bg-slate-900 dark:border-slate-800">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Page {admissionPage} of {totalAdmissionPages}</span>
              <Button variant="outline" size="sm" onClick={() => setAdmissionPage(p => Math.min(totalAdmissionPages, p + 1))} disabled={admissionPage === totalAdmissionPages} className="dark:bg-slate-900 dark:border-slate-800">
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          )}
        </TabsContent>

        {/* ─── CONTACTS TAB ─── */}
        <TabsContent value="contacts" className="mt-4 space-y-4 outline-none">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
            {[
              { label: 'Total', value: contactStats.total, className: 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800' },
              { label: 'Unread', value: contactStats.unread, className: 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20', labelColor: 'text-amber-600 dark:text-amber-400', valueColor: 'text-amber-700 dark:text-amber-300' },
              { label: 'Read', value: contactStats.read, className: 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20', labelColor: 'text-blue-600 dark:text-blue-400', valueColor: 'text-blue-700 dark:text-blue-300' },
              { label: 'Resolved', value: contactStats.resolved, className: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20', labelColor: 'text-emerald-600 dark:text-emerald-400', valueColor: 'text-emerald-700 dark:text-emerald-300' },
              { label: 'Urgent', value: contactStats.urgent, className: 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20', labelColor: 'text-rose-500 dark:text-rose-400', valueColor: 'text-rose-600 dark:text-rose-300' },
            ].map((stat, i) => (
              <Card key={i} className={`shadow-sm transition-all hover:shadow-md ${stat.className}`}>
                <CardContent className="p-3 text-center">
                  <p className={`text-[11px] font-medium uppercase tracking-wider ${stat.labelColor || 'text-slate-500 dark:text-slate-400'}`}>{stat.label}</p>
                  <motion.p 
                    key={stat.value}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className={`text-xl sm:text-2xl font-bold mt-1 ${stat.valueColor || 'text-slate-900 dark:text-slate-100'}`}
                  >
                    {stat.value}
                  </motion.p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters & Search */}
          <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                ref={searchInputRef}
                placeholder="Search contacts... (Ctrl+K)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-10 text-sm bg-slate-50 dark:bg-slate-800/60 dark:border-slate-700 dark:text-white"
              />
            </div>
            <div className="flex gap-2">
              <Select value={contactStatusFilter} onValueChange={setContactStatusFilter}>
                <SelectTrigger className="w-[130px] h-10 text-xs dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-200">
                  <Filter className="h-3.5 w-3.5 mr-1" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as 'newest' | 'oldest')}>
                <SelectTrigger className="w-[120px] h-10 text-xs dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-200">
                  <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                </SelectContent>
              </Select>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-10 w-10 p-0 dark:bg-slate-800/60 dark:border-slate-700 dark:hover:bg-slate-800">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="dark:bg-slate-900 dark:border-slate-800">
                  <DropdownMenuItem onClick={() => handleBulkStatusUpdate('contact_inquiries', 'read')} disabled={processing} className="dark:focus:bg-slate-800">
                    <Eye className="h-4 w-4 mr-2" />Mark All as Read
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusUpdate('contact_inquiries', 'resolved')} disabled={processing} className="dark:focus:bg-slate-800">
                    <CheckCheck className="h-4 w-4 mr-2 text-emerald-500" />Resolve All Open
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <p className="text-xs text-slate-500 dark:text-slate-400 px-1">
            Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{paginatedContacts.length}</span> of {sortedContacts.length} inquiries
          </p>

          {/* Contacts List */}
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden rounded-2xl">
            <CardContent className="p-0">
              <AnimatePresence mode="wait">
                {paginatedContacts.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16 px-4"
                  >
                    <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No contact inquiries found</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">There are no inquiries matching your criteria.</p>
                    {contactStatusFilter !== 'all' && (
                      <Button variant="outline" size="sm" onClick={() => setContactStatusFilter('all')} className="dark:bg-slate-800 dark:border-slate-700">Clear filter</Button>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="divide-y divide-slate-100 dark:divide-slate-800/60"
                  >
                    {paginatedContacts.map((inq, index) => (
                      <motion.div
                        key={inq.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">{inq.name}</h3>
                              {getContactStatusBadge(inq.status)}
                              {inq.is_urgent && <Badge variant="outline" className="bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30 text-[10px] flex items-center gap-1"><AlertCircle className="h-3 w-3" />Urgent</Badge>}
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mb-2 flex-wrap">
                              <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{inq.email}</span>
                              {inq.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{inq.phone}</span>}
                              <span className="flex items-center gap-1" suppressHydrationWarning><Calendar className="h-3 w-3" />{formatDate(inq.created_at)}</span>
                            </div>
                            <p className="text-xs text-slate-800 dark:text-slate-200 font-medium mb-1 line-clamp-1">{inq.subject}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{inq.message}</p>
                            <div className="flex items-center gap-1.5 mt-2">
                              <Badge variant="secondary" className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">{getInquiryTypeLabel(inq.inquiry_type)}</Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleQuickReply(inq.email, inq.subject)}
                              className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-slate-800"
                              title="Reply via email"
                            >
                              <Reply className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { setSelectedItem({ ...inq, _table: 'contact_inquiries' }); setAdminNotes(inq.admin_notes || ''); setShowDialog(true) }}
                              className="h-8 px-2 text-xs text-slate-600 hover:text-purple-600 dark:text-slate-300 dark:hover:text-purple-400 dark:hover:bg-slate-800"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" /> View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { setItemToDelete({ id: inq.id, table: 'contact_inquiries' }); setShowDeleteAlert(true) }}
                              className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:text-slate-500 dark:hover:text-red-400 dark:hover:bg-red-500/10"
                              title="Delete Inquiry"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalContactPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setContactPage(p => Math.max(1, p - 1))} disabled={contactPage === 1} className="dark:bg-slate-900 dark:border-slate-800">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Page {contactPage} of {totalContactPages}</span>
              <Button variant="outline" size="sm" onClick={() => setContactPage(p => Math.min(totalContactPages, p + 1))} disabled={contactPage === totalContactPages} className="dark:bg-slate-900 dark:border-slate-800">
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* View/Details Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto dark:bg-slate-900 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              {selectedItem?._table === 'admission_applications' ? getFullName(selectedItem) : selectedItem?.name}
            </DialogTitle>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-2 text-sm text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400" /><span className="truncate">{selectedItem.email}</span></div>
                {selectedItem.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" /><span>{selectedItem.phone}</span></div>}
                <div className="flex items-center gap-2" suppressHydrationWarning><Calendar className="h-4 w-4 text-slate-400" /><span>{formatDate(selectedItem.created_at)}</span></div>
                <div className="flex items-center">
                  {selectedItem._table === 'admission_applications'
                    ? getAdmissionStatusBadge(selectedItem.status)
                    : getContactStatusBadge(selectedItem.status)
                  }
                </div>
              </div>

              {selectedItem._table === 'admission_applications' && (
                <div className="bg-purple-50/50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 rounded-xl p-4 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  <p><strong className="text-slate-900 dark:text-slate-100">Class Applied:</strong> {selectedItem.applying_for_class}</p>
                  <p><strong className="text-slate-900 dark:text-slate-100">Parent/Guardian:</strong> {selectedItem.parent_name}</p>
                  <p><strong className="text-slate-900 dark:text-slate-100">Parent Phone:</strong> {selectedItem.parent_phone}</p>
                  {selectedItem.parent_email && <p><strong className="text-slate-900 dark:text-slate-100">Parent Email:</strong> {selectedItem.parent_email}</p>}
                  {selectedItem.current_school && <p><strong className="text-slate-900 dark:text-slate-100">Current School:</strong> {selectedItem.current_school}</p>}
                  {selectedItem.date_of_birth && <p><strong className="text-slate-900 dark:text-slate-100">DOB:</strong> {selectedItem.date_of_birth}</p>}
                  {selectedItem.gender && <p><strong className="text-slate-900 dark:text-slate-100">Gender:</strong> {selectedItem.gender}</p>}
                  {selectedItem.address && <p><strong className="text-slate-900 dark:text-slate-100">Address:</strong> {selectedItem.address}, {selectedItem.city}, {selectedItem.state}</p>}
                  {selectedItem.medical_conditions && <p><strong className="text-slate-900 dark:text-slate-100">Medical:</strong> {selectedItem.medical_conditions}</p>}
                  {selectedItem.how_did_you_hear && <p><strong className="text-slate-900 dark:text-slate-100">Source:</strong> {selectedItem.how_did_you_hear}</p>}
                  {selectedItem.additional_notes && (
                    <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-500/30">
                      <p><strong className="text-slate-900 dark:text-slate-100">Additional Notes:</strong></p>
                      <p className="text-slate-600 dark:text-slate-400 mt-1 whitespace-pre-wrap">{selectedItem.additional_notes}</p>
                    </div>
                  )}
                </div>
              )}

              {selectedItem._table === 'contact_inquiries' && (
                <div className="bg-blue-50/50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl p-4 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  <p><strong className="text-slate-900 dark:text-slate-100">Subject:</strong> {selectedItem.subject}</p>
                  <p><strong className="text-slate-900 dark:text-slate-100">Type:</strong> {getInquiryTypeLabel(selectedItem.inquiry_type)}</p>
                  {selectedItem.vin_id && <p><strong className="text-slate-900 dark:text-slate-100">VIN ID:</strong> {selectedItem.vin_id}</p>}
                  {selectedItem.student_class && <p><strong className="text-slate-900 dark:text-slate-100">Class:</strong> {selectedItem.student_class}</p>}
                  {selectedItem.admission_year && <p><strong className="text-slate-900 dark:text-slate-100">Admission Year:</strong> {selectedItem.admission_year}</p>}
                  <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-500/30">
                    <p><strong className="text-slate-900 dark:text-slate-100">Message:</strong></p>
                    <p className="text-slate-600 dark:text-slate-400 mt-1 whitespace-pre-wrap">{selectedItem.message}</p>
                  </div>
                </div>
              )}

              {selectedItem.admin_notes && (
                <div className="bg-amber-50 dark:bg-amber-500/10 rounded-xl p-3 border border-amber-200 dark:border-amber-500/30">
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold mb-1">Previous Notes:</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300">{selectedItem.admin_notes}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-1.5 block text-slate-900 dark:text-slate-200">Admin Notes</label>
                <Textarea
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  placeholder="Add internal notes..."
                  rows={3}
                  className="text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex-1 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openReplyDialog(selectedItem)}
                className="text-blue-600 dark:text-blue-400 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700"
              >
                <Reply className="h-4 w-4 mr-1" />Reply via Email
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const email = selectedItem?.email
                  const subject = selectedItem?.subject || `Admission - ${getFullName(selectedItem)}`
                  handleQuickReply(email, subject)
                }}
                className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <ExternalLink className="h-4 w-4 mr-1" />Quick Reply
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowDialog(false)} className="dark:text-slate-300 dark:hover:bg-slate-800">Close</Button>
            {selectedItem?._table === 'admission_applications' && selectedItem?.status === 'pending' && (
              <>
                <Button size="sm" onClick={() => handleUpdateStatus(selectedItem.id, 'reviewed', 'admission_applications')} disabled={processing} className="bg-blue-600 hover:bg-blue-700">
                  <Eye className="h-4 w-4 mr-1" />Review
                </Button>
                <Button size="sm" onClick={() => handleUpdateStatus(selectedItem.id, 'approved', 'admission_applications')} disabled={processing} className="bg-emerald-600 hover:bg-emerald-700">
                  <CheckCircle className="h-4 w-4 mr-1" />Approve
                </Button>
                <Button size="sm" onClick={() => handleUpdateStatus(selectedItem.id, 'rejected', 'admission_applications')} disabled={processing} className="bg-red-600 hover:bg-red-700">
                  <XCircle className="h-4 w-4 mr-1" />Reject
                </Button>
              </>
            )}
            {selectedItem?._table === 'contact_inquiries' && selectedItem?.status === 'unread' && (
              <Button size="sm" onClick={() => handleUpdateStatus(selectedItem.id, 'read', 'contact_inquiries')} disabled={processing} className="bg-blue-600 hover:bg-blue-700">
                <Eye className="h-4 w-4 mr-1" />Mark Read
              </Button>
            )}
            {(selectedItem?._table === 'contact_inquiries' && (selectedItem?.status === 'unread' || selectedItem?.status === 'read')) && (
              <Button size="sm" onClick={() => handleUpdateStatus(selectedItem.id, 'resolved', 'contact_inquiries')} disabled={processing} className="bg-emerald-600 hover:bg-emerald-700">
                <CheckCircle className="h-4 w-4 mr-1" />Resolve
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={replyDialog} onOpenChange={setReplyDialog}>
        <DialogContent className="max-w-md dark:bg-slate-900 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 dark:text-white">
              <Send className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Reply via Email
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs text-slate-500 dark:text-slate-400">To</Label>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-0.5">{selectedItem?.email}</p>
            </div>
            <div>
              <Label className="text-xs text-slate-500 dark:text-slate-400">Subject</Label>
              <Input value={replySubject} onChange={e => setReplySubject(e.target.value)} className="text-sm mt-1 dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
            </div>
            <div>
              <Label className="text-xs text-slate-500 dark:text-slate-400">Message</Label>
              <Textarea value={replyBody} onChange={e => setReplyBody(e.target.value)} rows={6} className="text-sm mt-1 dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyDialog(false)} className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">Cancel</Button>
            <Button onClick={handleReplyViaEmail} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Send className="h-4 w-4 mr-1" />Open Email Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent className="dark:bg-slate-900 dark:border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-500">
              <AlertCircle className="h-5 w-5" />
              Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription className="dark:text-slate-400">
              This action cannot be undone. This will permanently delete this inquiry and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => itemToDelete && handleDelete(itemToDelete.id, itemToDelete.table)}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={processing}
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}