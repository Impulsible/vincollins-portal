/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// components/admin/staff/StaffManagement.tsx - COMPLETE FIXED VERSION
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  UserPlus, MoreVertical, Edit, Trash2, KeyRound, Copy, CheckCircle,
  Shield, RefreshCw, Loader2, Users, Search, X, Eye, Circle, CircleDot,
  Wifi, WifiOff, Clock, AlertCircle, Phone, Mail, MapPin
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

// FIXED: Staff interface - only includes fields that exist in profiles table
interface Staff {
  id: string
  vin_id: string
  email: string
  full_name: string
  first_name?: string
  last_name?: string
  department: string
  phone: string
  address: string
  is_active: boolean
  photo_url?: string
  password_changed: boolean
  created_at: string
}

interface StaffManagementProps {
  staff: Staff[]
  onAddStaff: (staffData: any) => Promise<{ email: string; password: string; vin_id: string } | void>
  onUpdateStaff: (updatedStaff: Staff) => Promise<void>
  onDeleteStaff: (staffMember: Staff) => Promise<void>
  onResetPassword: (staffMember: Staff) => Promise<void>
  onRefresh?: () => void
}

const departments = ['Administration', 'Academic', 'Science', 'Arts', 'Commercial', 'Technology', 'Finance', 'HR']
const currentYear = new Date().getFullYear()

const generateJoinYears = (): number[] => {
  const startYear = 2022
  const endYear = currentYear + 10
  const years: number[] = []
  for (let year = startYear; year <= endYear; year++) years.push(year)
  return years
}

const joinYears = generateJoinYears()

const formatFullName = (firstName: string, lastName: string): string => {
  if (!firstName || !lastName) return 'Staff Member'
  const first = firstName.trim()
  const last = lastName.trim()
  const formattedFirst = first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
  const formattedLast = last.charAt(0).toUpperCase() + last.slice(1).toLowerCase()
  return `${formattedFirst} ${formattedLast}`
}

const formatLastSeen = (timestamp?: string) => {
  if (!timestamp) return 'Never'
  const lastSeen = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - lastSeen.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  return lastSeen.toLocaleDateString()
}

const generateStaffEmail = (firstName: string, lastName: string): string => {
  const cleanFirst = firstName.toLowerCase().trim().replace(/[^a-z0-9]/g, '').slice(0, 15) || 'staff'
  const cleanLast = lastName.toLowerCase().trim().replace(/[^a-z0-9]/g, '').slice(0, 15) || 'member'
  return `${cleanFirst}.${cleanLast}@vincollins.edu.ng`
}

const generateRandomFourDigits = (): string => String(Math.floor(Math.random() * 9000) + 1000)

const generateStaffVIN = async (year: number): Promise<string> => {
  let isUnique = false
  let vinId = ''
  let attempts = 0
  const maxAttempts = 20

  while (!isUnique && attempts < maxAttempts) {
    const randomDigits = generateRandomFourDigits()
    vinId = `VIN-STF-${year}-${randomDigits}`
    const { data } = await supabase.from('users').select('vin_id').eq('vin_id', vinId).maybeSingle()
    if (!data) isUnique = true
    attempts++
  }

  if (!isUnique) {
    const timestamp = Date.now().toString().slice(-4)
    vinId = `VIN-STF-${year}-${timestamp}`
  }
  return vinId
}

const copyToClipboard = (text: string, label: string) => {
  navigator.clipboard.writeText(text)
  toast.success(`${label} copied to clipboard!`)
}

export function StaffManagement({ 
  staff, onAddStaff, onUpdateStaff, onDeleteStaff, onResetPassword, onRefresh 
}: StaffManagementProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showViewDetailsDialog, setShowViewDetailsDialog] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [newCredentials, setNewCredentials] = useState<{ email: string; password: string; vin_id: string } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [onlineStaff, setOnlineStaff] = useState<Set<string>>(new Set())
  const [awayStaff, setAwayStaff] = useState<Set<string>>(new Set())
  const [staffLastSeen, setStaffLastSeen] = useState<Map<string, string>>(new Map())
  
  // FIXED: Removed position, qualification, hire_date from form state
  const [newStaff, setNewStaff] = useState({
    first_name: '',
    last_name: '',
    department: '',
    phone: '',
    address: '',
    join_year: currentYear,
  })

  useEffect(() => {
    console.log(`StaffManagement: Received ${staff.length} staff members`)
  }, [staff])

  useEffect(() => {
    if (!staff.length) return
    const presenceChannel = supabase.channel('online-users', {
      config: { presence: { key: 'admin-staff-tracker' } },
    })
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState()
        const online = new Set<string>()
        const away = new Set<string>()
        const lastSeenMap = new Map<string, string>()
        Object.values(state).forEach((presences: any) => {
          presences.forEach((presence: any) => {
            if (presence.user_id && (presence.role === 'staff' || presence.role === 'teacher')) {
              if (presence.status === 'online') online.add(presence.user_id)
              else if (presence.status === 'away') away.add(presence.user_id)
              if (presence.last_seen) lastSeenMap.set(presence.user_id, presence.last_seen)
            }
          })
        })
        setOnlineStaff(online)
        setAwayStaff(away)
        setStaffLastSeen(prev => new Map([...prev, ...lastSeenMap]))
      })
      .subscribe()
    return () => { presenceChannel.unsubscribe() }
  }, [staff.length])

  const sortedStaff = useMemo(() => {
    return [...staff].sort((a, b) => {
      const nameA = a.full_name?.toLowerCase() || ''
      const nameB = b.full_name?.toLowerCase() || ''
      return nameA.localeCompare(nameB)
    })
  }, [staff])

  const filteredStaff = useMemo(() => {
    if (!searchQuery) return sortedStaff
    const query = searchQuery.toLowerCase()
    return sortedStaff.filter(member =>
      member.full_name?.toLowerCase().includes(query) ||
      member.email?.toLowerCase().includes(query) ||
      member.vin_id?.toLowerCase().includes(query) ||
      member.department?.toLowerCase().includes(query)
    )
  }, [sortedStaff, searchQuery])

  const getStaffStatus = useCallback((staffId: string): 'online' | 'away' | 'offline' => {
    if (onlineStaff.has(staffId)) return 'online'
    if (awayStaff.has(staffId)) return 'away'
    return 'offline'
  }, [onlineStaff, awayStaff])

  const getStatusIcon = useCallback((staffId: string) => {
    const status = getStaffStatus(staffId)
    switch (status) {
      case 'online': return <Wifi className="h-3 w-3 text-emerald-500" />
      case 'away': return <CircleDot className="h-3 w-3 text-amber-500" />
      default: return <WifiOff className="h-3 w-3 text-slate-400" />
    }
  }, [getStaffStatus])

  const getStatusText = useCallback((staffId: string) => {
    const status = getStaffStatus(staffId)
    switch (status) {
      case 'online': return 'Online'
      case 'away': return 'Away'
      default: return 'Offline'
    }
  }, [getStaffStatus])

  // FIXED: Only send fields that exist in profiles table
  const handleAddStaffClick = async () => {
    if (!newStaff.first_name || !newStaff.last_name || !newStaff.department) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      const fullName = formatFullName(newStaff.first_name, newStaff.last_name)
      const email = generateStaffEmail(newStaff.first_name, newStaff.last_name)
      const year = newStaff.join_year || currentYear
      const vinId = await generateStaffVIN(year)
      
      // FIXED: Only send fields that exist in profiles table
      const staffData = {
        first_name: newStaff.first_name.trim(),
        last_name: newStaff.last_name.trim(),
        department: newStaff.department,
        phone: newStaff.phone || null,
        address: newStaff.address || null,
        join_year: year,
        // DO NOT send: position, qualification, hire_date, full_name, email, vin_id
      }
      
      console.log('Creating staff:', { fullName, email, vinId, year })
      
      const result = await onAddStaff(staffData)
      
      if (result) {
        setNewCredentials({
          email: result.email,
          password: result.password,
          vin_id: result.vin_id,
        })
      } else {
        setNewCredentials({ email, password: vinId, vin_id: vinId })
      }
      
      setShowAddDialog(false)
      setShowCredentialsDialog(true)
      
      setNewStaff({
        first_name: '', last_name: '', department: '',
        phone: '', address: '', join_year: currentYear,
      })
      
      if (onRefresh) onRefresh()
      toast.success(`${fullName} added successfully!`)
    } catch (error: any) {
      console.error('Error adding staff:', error)
      toast.error(error.message || 'Failed to add staff member')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateStaffClick = async () => {
    if (!selectedStaff) return
    setIsSubmitting(true)
    try {
      // FIXED: Only send fields that exist in profiles
      await onUpdateStaff(selectedStaff)
      setShowEditDialog(false)
      setSelectedStaff(null)
      toast.success('Staff updated successfully!')
      if (onRefresh) onRefresh()
    } catch (error: any) {
      console.error('Error updating staff:', error)
      toast.error(error.message || 'Failed to update staff')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteStaffClick = async () => {
    if (!selectedStaff) return
    setIsSubmitting(true)
    try {
      await onDeleteStaff(selectedStaff)
      setShowDeleteConfirm(false)
      setSelectedStaff(null)
      toast.success('Staff deleted successfully!')
      if (onRefresh) onRefresh()
    } catch (error: any) {
      console.error('Error deleting staff:', error)
      toast.error(error.message || 'Failed to delete staff')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetPasswordClick = async (staffMember: Staff) => {
    try {
      await onResetPassword(staffMember)
      toast.success(`Password reset to: ${staffMember.vin_id}`)
      navigator.clipboard?.writeText(staffMember.vin_id)
    } catch (error) {
      toast.error('Failed to reset password')
    }
  }

  const handleRefresh = () => {
    if (onRefresh) onRefresh()
    else window.location.reload()
  }

  return (
    <div className="space-y-6">
      <motion.div 
        className="flex flex-wrap justify-between items-start lg:items-center gap-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Staff Management
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Total {staff.length} staff member{staff.length !== 1 ? 's' : ''}
            {onlineStaff.size > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                <Wifi className="h-3 w-3 mr-1 text-emerald-500" />
                {onlineStaff.size} online
              </Badge>
            )}
          </p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-secondary shadow-lg hover:shadow-xl transition-shadow">
              <UserPlus className="mr-2 h-4 w-4" /> Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Staff Member</DialogTitle>
              <DialogDescription>
                Enter staff details. Email and VIN ID will be auto-generated.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>First Name *</Label><Input value={newStaff.first_name} onChange={(e) => setNewStaff({ ...newStaff, first_name: e.target.value })} placeholder="John" className="mt-1" /></div>
                <div><Label>Last Name *</Label><Input value={newStaff.last_name} onChange={(e) => setNewStaff({ ...newStaff, last_name: e.target.value })} placeholder="Doe" className="mt-1" /></div>
              </div>
              
              <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Mail className="h-3 w-3" /> Auto-generated Email</p>
                <p className="font-mono text-sm">{newStaff.first_name && newStaff.last_name ? generateStaffEmail(newStaff.first_name, newStaff.last_name) : 'first.last@vincollins.edu.ng'}</p>
              </div>
              
              <div>
                <Label>Department *</Label>
                <Select value={newStaff.department} onValueChange={(v) => setNewStaff({ ...newStaff, department: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>{departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Phone</Label><Input value={newStaff.phone} onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })} placeholder="+234 XXX XXX XXXX" className="mt-1" /></div>
                <div><Label>Join Year</Label><Select value={newStaff.join_year?.toString()} onValueChange={(v) => setNewStaff({ ...newStaff, join_year: parseInt(v) })}><SelectTrigger className="mt-1"><SelectValue placeholder="Select join year" /></SelectTrigger><SelectContent className="max-h-[200px]">{joinYears.map(year => <SelectItem key={year} value={year.toString()}>{year}</SelectItem>)}</SelectContent></Select></div>
              </div>
              
              <div><Label>Address</Label><Input value={newStaff.address} onChange={(e) => setNewStaff({ ...newStaff, address: e.target.value })} placeholder="Staff address" className="mt-1" /></div>
              
              <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
                <p className="text-xs text-primary/80 flex items-center gap-2"><Shield className="h-3 w-3" /><strong>Auto-generated credentials:</strong> VIN ID will be created as VIN-STF-{newStaff.join_year || currentYear}-XXXX</p>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
              <Button onClick={handleAddStaffClick} disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Add Staff</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, email, VIN ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 pr-8" />
          {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="h-4 w-4 text-muted-foreground hover:text-foreground" /></button>}
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
      </div>

      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-semibold py-4 px-4">Staff Member</TableHead>
                <TableHead className="font-semibold py-4 px-4">VIN ID</TableHead>
                <TableHead className="font-semibold py-4 px-4">Department</TableHead>
                <TableHead className="font-semibold py-4 px-4 hidden md:table-cell">Phone</TableHead>
                <TableHead className="font-semibold py-4 px-4">Status</TableHead>
                <TableHead className="font-semibold py-4 px-4 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-16"><div className="flex flex-col items-center gap-3"><Users className="h-8 w-8 text-muted-foreground/40" /><p className="text-muted-foreground font-medium">No staff members found</p></div></TableCell></TableRow>
              ) : (
                filteredStaff.map((member, index) => {
                  const status = getStaffStatus(member.id)
                  return (
                    <motion.tr key={member.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.02 }} className="border-b hover:bg-muted/30 transition-colors">
                      <TableCell className="py-4 px-4">
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <div className="relative flex-shrink-0">
                            <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                              <AvatarImage src={member.photo_url} />
                              <AvatarFallback className="bg-gradient-to-br from-blue-500/20 to-blue-500/10 text-blue-600 font-medium">
                                {member.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'S'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-0.5 -right-0.5">{getStatusIcon(member.id)}</div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{member.full_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-4"><code className="text-xs bg-muted px-2 py-1 rounded font-mono whitespace-nowrap">{member.vin_id}</code></TableCell>
                      <TableCell className="py-4 px-4"><Badge variant="outline" className="font-normal whitespace-nowrap">{member.department || '-'}</Badge></TableCell>
                      <TableCell className="py-4 px-4 hidden md:table-cell"><div className="flex items-center gap-1 whitespace-nowrap"><Phone className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{member.phone || '-'}</span></div></TableCell>
                      <TableCell className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          {member.is_active ? <><span className={cn("text-sm font-medium", status === 'online' && "text-emerald-600", status === 'away' && "text-amber-600", status === 'offline' && "text-slate-500")}>{getStatusText(member.id)}</span></> : <><Circle className="h-3 w-3 text-red-400" /><span className="text-sm text-red-500">Inactive</span></>}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-4 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => { setSelectedStaff(member); setShowViewDetailsDialog(true) }}><Eye className="mr-2 h-4 w-4" /> View Details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSelectedStaff(member); setShowEditDialog(true) }}><Edit className="mr-2 h-4 w-4" /> Edit Profile</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleResetPasswordClick(member)}><KeyRound className="mr-2 h-4 w-4" /> Reset Password</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => { setSelectedStaff(member); setShowDeleteConfirm(true) }} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Credentials Dialog */}
      <Dialog open={showCredentialsDialog} onOpenChange={setShowCredentialsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-emerald-500" />Staff Account Created!</DialogTitle><DialogDescription>Save these credentials.</DialogDescription></DialogHeader>
          {newCredentials && (
            <div className="space-y-4 py-4">
              <div className="bg-muted rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center"><div><p className="text-xs text-muted-foreground">Email</p><p className="font-mono text-sm">{newCredentials.email}</p></div><Button variant="ghost" size="sm" onClick={() => copyToClipboard(newCredentials.email, 'Email')}><Copy className="h-3 w-3" /></Button></div>
                <div className="flex justify-between items-center"><div><p className="text-xs text-muted-foreground">Password</p><p className="font-mono text-sm font-bold text-primary">{newCredentials.password}</p></div><Button variant="ghost" size="sm" onClick={() => copyToClipboard(newCredentials.password, 'Password')}><Copy className="h-3 w-3" /></Button></div>
              </div>
            </div>
          )}
          <DialogFooter><Button onClick={() => setShowCredentialsDialog(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog - Simplified */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>Edit Staff Member</DialogTitle></DialogHeader>
          {selectedStaff && (
            <div className="space-y-4 py-4">
              <div><Label>Full Name</Label><Input value={selectedStaff.full_name} onChange={(e) => setSelectedStaff({ ...selectedStaff, full_name: e.target.value })} /></div>
              <div><Label>Department</Label><Select value={selectedStaff.department} onValueChange={(v) => setSelectedStaff({ ...selectedStaff, department: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Phone</Label><Input value={selectedStaff.phone || ''} onChange={(e) => setSelectedStaff({ ...selectedStaff, phone: e.target.value })} /></div>
              <div><Label>Address</Label><Input value={selectedStaff.address || ''} onChange={(e) => setSelectedStaff({ ...selectedStaff, address: e.target.value })} /></div>
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={selectedStaff.is_active} onChange={(e) => setSelectedStaff({ ...selectedStaff, is_active: e.target.checked })} className="sr-only peer" />
                  <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  <span className="ml-3 text-sm font-medium">Active Account</span>
                </label>
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button><Button onClick={handleUpdateStaffClick} disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent><DialogHeader><DialogTitle className="text-red-600">Confirm Deletion</DialogTitle></DialogHeader>
        {selectedStaff && <div className="py-4"><p>Delete {selectedStaff.full_name}?</p></div>}
        <DialogFooter><Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button><Button variant="destructive" onClick={handleDeleteStaffClick}>Delete</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={showViewDetailsDialog} onOpenChange={setShowViewDetailsDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Staff Details</DialogTitle></DialogHeader>
          {selectedStaff && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16"><AvatarFallback>{selectedStaff.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}</AvatarFallback></Avatar>
                <div><p className="text-xl font-bold">{selectedStaff.full_name}</p><p className="text-sm text-muted-foreground">{selectedStaff.email}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-3 bg-muted rounded-lg p-4">
                <div><p className="text-xs text-muted-foreground">VIN ID</p><p className="font-mono font-medium">{selectedStaff.vin_id}</p></div>
                <div><p className="text-xs text-muted-foreground">Department</p><p className="font-medium">{selectedStaff.department || '-'}</p></div>
                <div><p className="text-xs text-muted-foreground">Phone</p><p className="font-medium">{selectedStaff.phone || '-'}</p></div>
                <div><p className="text-xs text-muted-foreground">Status</p><Badge className={selectedStaff.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>{selectedStaff.is_active ? 'Active' : 'Inactive'}</Badge></div>
              </div>
            </div>
          )}
          <DialogFooter><Button onClick={() => setShowViewDetailsDialog(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default StaffManagement