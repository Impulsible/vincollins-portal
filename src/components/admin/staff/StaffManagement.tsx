/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// components/admin/staff/StaffManagement.tsx - PROFESSIONALLY STYLED

'use client'

import { useState, useEffect, useMemo } from 'react'
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
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  UserPlus, MoreVertical, Edit, Trash2, KeyRound, Copy, CheckCircle,
  Shield, RefreshCw, Loader2, Users, Search, X, Eye,
  Phone, Mail, Calendar, MapPin, Building, AlertCircle, Circle
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

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
  
  const [newStaff, setNewStaff] = useState({
    first_name: '',
    last_name: '',
    department: '',
    phone: '',
    address: '',
    join_year: currentYear,
  })

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

  const handleAddStaffClick = async () => {
    if (!newStaff.first_name || !newStaff.last_name || !newStaff.department) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      const year = newStaff.join_year || currentYear
      
      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: newStaff.first_name.trim(),
          middle_name: '',
          last_name: newStaff.last_name.trim(),
          role: 'staff',
          department: newStaff.department,
          join_year: year,
          phone: newStaff.phone || '',
          address: newStaff.address || ''
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create staff member')
      }
      
      const result = await response.json()
      
      setNewCredentials({
        email: result.credentials.email,
        password: result.credentials.password,
        vin_id: result.credentials.vin_id
      })
      
      setNewStaff({
        first_name: '',
        last_name: '',
        department: '',
        phone: '',
        address: '',
        join_year: currentYear,
      })
      
      setShowAddDialog(false)
      toast.success(`${result.user.full_name} added successfully!`)
      
      setTimeout(() => {
        if (onRefresh) onRefresh()
      }, 200)
      
      setTimeout(() => {
        setShowCredentialsDialog(true)
      }, 600)
      
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

  // Stats for summary cards
  const activeCount = staff.filter(s => s.is_active).length
  const inactiveCount = staff.filter(s => !s.is_active).length
  const departmentCount = new Set(staff.map(s => s.department).filter(Boolean)).size

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <motion.div 
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="h-7 w-7 text-emerald-600" />
            Staff Management
          </h1>
          <p className="text-slate-500 mt-1">Manage staff profiles, credentials, and department assignments</p>
        </div>
        
        <Button 
          onClick={() => setShowAddDialog(true)}
          className="bg-emerald-600 hover:bg-emerald-700 shadow-sm hover:shadow-md transition-all h-10"
        >
          <UserPlus className="mr-2 h-4 w-4" /> Add Staff
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Total Staff</p>
                <p className="text-2xl font-bold text-slate-800">{staff.length}</p>
              </div>
              <div className="h-10 w-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Active</p>
                <p className="text-2xl font-bold text-green-600">{activeCount}</p>
              </div>
              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="border-l-4 border-l-slate-500 shadow-sm hover:shadow-md transition-shadow">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Inactive</p>
                <p className="text-2xl font-bold text-slate-600">{inactiveCount}</p>
              </div>
              <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Circle className="h-5 w-5 text-slate-500" />
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Departments</p>
                <p className="text-2xl font-bold text-purple-600">{departmentCount}</p>
              </div>
              <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Building className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search by name, email, VIN ID, or department..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="pl-9 pr-8 h-10"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
            </button>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => onRefresh?.()} className="h-10">
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* Add Staff Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto p-0">
          <div className="sticky top-0 bg-white dark:bg-slate-950 z-10 border-b px-6 py-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <UserPlus className="h-5 w-5 text-emerald-600" />
                Add New Staff Member
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-slate-500 mt-1">Email and VIN ID will be auto-generated</p>
          </div>
          
          <div className="space-y-5 px-6 py-5">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-semibold text-slate-700">Personal Information</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-slate-500">First Name *</Label>
                  <Input 
                    value={newStaff.first_name} 
                    onChange={(e) => setNewStaff({ ...newStaff, first_name: e.target.value })} 
                    placeholder="First name"
                    className="mt-1 h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Last Name *</Label>
                  <Input 
                    value={newStaff.last_name} 
                    onChange={(e) => setNewStaff({ ...newStaff, last_name: e.target.value })} 
                    placeholder="Last name"
                    className="mt-1 h-9"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-700">Employment Details</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-slate-500">Department *</Label>
                  <Select value={newStaff.department} onValueChange={(v) => setNewStaff({ ...newStaff, department: v })}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Join Year</Label>
                  <Select value={newStaff.join_year?.toString()} onValueChange={(v) => setNewStaff({ ...newStaff, join_year: parseInt(v) })}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select join year" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {joinYears.map(year => <SelectItem key={year} value={year.toString()}>{year}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-purple-600" />
                <h3 className="text-sm font-semibold text-slate-700">Auto-generated Email</h3>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                <p className="font-mono text-sm text-emerald-600">
                  {newStaff.first_name && newStaff.last_name 
                    ? `${newStaff.first_name.toLowerCase().replace(/[^a-z]/g, '')}.${newStaff.last_name.toLowerCase().replace(/[^a-z]/g, '')}@vincollins.edu.ng`
                    : 'first.last@vincollins.edu.ng'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-700">Contact Information</h3>
                <Badge variant="outline" className="text-[10px]">Optional</Badge>
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-slate-500">Phone Number</Label>
                  <Input 
                    value={newStaff.phone} 
                    onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })} 
                    placeholder="+234 XXX XXX XXXX"
                    className="mt-1 h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Address</Label>
                  <Input 
                    value={newStaff.address} 
                    onChange={(e) => setNewStaff({ ...newStaff, address: e.target.value })} 
                    placeholder="Staff address"
                    className="mt-1 h-9"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="sticky bottom-0 bg-white dark:bg-slate-950 border-t px-6 py-4 gap-2">
            <Button variant="outline" onClick={() => setShowAddDialog(false)} className="h-9">
              Cancel
            </Button>
            <Button onClick={handleAddStaffClick} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 h-9">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
              {isSubmitting ? 'Creating...' : 'Add Staff'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Staff Table */}
      <Card className="border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-semibold py-3 px-4">Staff Member</TableHead>
                <TableHead className="font-semibold py-3 px-4">VIN ID</TableHead>
                <TableHead className="font-semibold py-3 px-4">Department</TableHead>
                <TableHead className="font-semibold py-3 px-4 hidden md:table-cell">Phone</TableHead>
                <TableHead className="font-semibold py-3 px-4">Status</TableHead>
                <TableHead className="font-semibold py-3 px-4 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <Users className="h-10 w-10 text-slate-300" />
                      <p className="text-slate-500 font-medium">No staff members found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredStaff.map((member, index) => (
                  <motion.tr
                    key={member.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="border-b hover:bg-slate-50/50 transition-colors"
                  >
                    <TableCell className="py-3 px-4">
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <Avatar className="h-10 w-10 ring-1 ring-slate-200">
                          <AvatarImage src={member.photo_url} />
                          <AvatarFallback className="bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 text-emerald-700 font-semibold text-sm">
                            {member.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'ST'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-800 truncate">{member.full_name}</p>
                          <p className="text-xs text-slate-500 truncate">{member.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono">{member.vin_id}</code>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <Badge variant="outline" className="font-normal bg-slate-50">
                        {member.department || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 px-4 hidden md:table-cell">
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-sm text-slate-600">{member.phone || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <Badge className={cn(
                        "text-xs font-medium px-2 py-0.5",
                        member.is_active 
                          ? "bg-emerald-100 text-emerald-700" 
                          : "bg-slate-100 text-slate-600"
                      )}>
                        {member.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => { setSelectedStaff(member); setShowViewDetailsDialog(true) }}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setSelectedStaff(member); setShowEditDialog(true) }}>
                            <Edit className="mr-2 h-4 w-4" /> Edit Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleResetPasswordClick(member)}>
                            <KeyRound className="mr-2 h-4 w-4" /> Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => { setSelectedStaff(member); setShowDeleteConfirm(true) }} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Credentials Dialog */}
      <Dialog open={showCredentialsDialog} onOpenChange={setShowCredentialsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              Staff Account Created
            </DialogTitle>
            <DialogDescription>
              Save these credentials for the staff member. Password = VIN ID
            </DialogDescription>
          </DialogHeader>
          {newCredentials && (
            <div className="space-y-4 py-2">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-slate-500">Email Address</p>
                    <p className="font-mono text-sm font-medium">{newCredentials.email}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(newCredentials.email, 'Email')} className="h-8">
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <div>
                    <p className="text-xs text-slate-500">Password / VIN ID</p>
                    <p className="font-mono text-sm font-bold text-emerald-600">{newCredentials.password}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(newCredentials.password, 'Password')} className="h-8">
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3 border border-amber-200">
                <p className="text-xs text-amber-700 flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5" />
                  <span>Staff will be prompted to change password on first login</span>
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowCredentialsDialog(false)} className="h-9">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
          </DialogHeader>
          {selectedStaff && (
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-sm">Full Name</Label>
                <Input 
                  value={selectedStaff.full_name} 
                  onChange={(e) => setSelectedStaff({ ...selectedStaff, full_name: e.target.value })} 
                  className="mt-1 h-9"
                />
              </div>
              <div>
                <Label className="text-sm">Department</Label>
                <Select value={selectedStaff.department} onValueChange={(v) => setSelectedStaff({ ...selectedStaff, department: v })}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Phone</Label>
                <Input 
                  value={selectedStaff.phone || ''} 
                  onChange={(e) => setSelectedStaff({ ...selectedStaff, phone: e.target.value })} 
                  className="mt-1 h-9"
                />
              </div>
              <div>
                <Label className="text-sm">Address</Label>
                <Input 
                  value={selectedStaff.address || ''} 
                  onChange={(e) => setSelectedStaff({ ...selectedStaff, address: e.target.value })} 
                  className="mt-1 h-9"
                />
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-slate-600">Account Status</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedStaff.is_active}
                    onChange={(e) => setSelectedStaff({ ...selectedStaff, is_active: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
                  <span className="ml-3 text-sm font-medium">
                    {selectedStaff.is_active ? 'Active' : 'Inactive'}
                  </span>
                </label>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)} className="h-9">Cancel</Button>
            <Button onClick={handleUpdateStaffClick} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 h-9">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Confirm Deletion
            </DialogTitle>
          </DialogHeader>
          {selectedStaff && (
            <div className="py-4">
              <p className="text-base font-medium">Delete {selectedStaff.full_name}?</p>
              <p className="text-sm text-slate-500 mt-1">This action cannot be undone.</p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="h-9">Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteStaffClick} disabled={isSubmitting} className="h-9">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={showViewDetailsDialog} onOpenChange={setShowViewDetailsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Staff Details</DialogTitle>
          </DialogHeader>
          {selectedStaff && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-4 pb-2 border-b">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-lg font-semibold">
                    {selectedStaff.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-bold text-slate-800">{selectedStaff.full_name}</p>
                  <p className="text-sm text-slate-500">{selectedStaff.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 bg-slate-50 rounded-lg p-4">
                <div>
                  <p className="text-xs text-slate-500">VIN ID</p>
                  <p className="font-mono text-sm font-medium">{selectedStaff.vin_id}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Department</p>
                  <p className="font-medium text-sm">{selectedStaff.department || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Phone</p>
                  <p className="font-medium text-sm">{selectedStaff.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Status</p>
                  <Badge className={cn(
                    "text-xs",
                    selectedStaff.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                  )}>
                    {selectedStaff.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              
              {selectedStaff.address && (
                <div>
                  <p className="text-xs text-slate-500">Address</p>
                  <p className="text-sm bg-slate-50 rounded-lg p-3">{selectedStaff.address}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowViewDetailsDialog(false)} className="h-9">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default StaffManagement