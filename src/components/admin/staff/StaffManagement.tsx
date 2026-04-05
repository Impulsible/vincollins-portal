/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  UserPlus,
  MoreVertical,
  Edit,
  Trash2,
  KeyRound,
  Mail,
  RefreshCw,
  Loader2,
  Users,
  Search,
  X,
  Shield,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Staff interface matching what the admin page sends
interface Staff {
  id: string
  vin_id: string
  email: string
  full_name: string
  department: string
  position: string
  qualification: string
  phone: string
  address: string
  hire_date: string
  is_active: boolean
  photo_url?: string
  password_changed: boolean
  created_at: string
}

interface StaffManagementProps {
  staff: Staff[]
  onAddStaff: (staffData: any) => Promise<void>
  onUpdateStaff: (updatedStaff: Staff) => Promise<void>
  onDeleteStaff: (staffMember: Staff) => Promise<void>
  onResetPassword: (staffMember: Staff) => Promise<void>
}

const departments = ['Administration', 'Academic', 'Science', 'Arts', 'Commercial', 'Technology', 'Finance', 'HR']

export function StaffManagement({ 
  staff, 
  onAddStaff, 
  onUpdateStaff, 
  onDeleteStaff, 
  onResetPassword 
}: StaffManagementProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [newStaff, setNewStaff] = useState({
    full_name: '',
    email: '',
    department: '',
    position: '',
    qualification: '',
    phone: '',
    address: '',
    hire_date: new Date().toISOString().split('T')[0],
  })

  // Filter staff based on search
  const filteredStaff = staff.filter(member =>
    member.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.vin_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.department?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddStaffClick = async () => {
    if (!newStaff.full_name || !newStaff.email || !newStaff.department) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      await onAddStaff(newStaff)
      setShowAddDialog(false)
      setNewStaff({
        full_name: '',
        email: '',
        department: '',
        position: '',
        qualification: '',
        phone: '',
        address: '',
        hire_date: new Date().toISOString().split('T')[0],
      })
    } catch (error) {
      console.error('Error adding staff:', error)
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
    } catch (error) {
      console.error('Error updating staff:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteStaffClick = async (staffMember: Staff) => {
    if (!confirm(`Are you sure you want to delete ${staffMember.full_name}? This action cannot be undone.`)) return
    
    try {
      await onDeleteStaff(staffMember)
    } catch (error) {
      console.error('Error deleting staff:', error)
    }
  }

  const handleResetPasswordClick = async (staffMember: Staff) => {
    try {
      await onResetPassword(staffMember)
    } catch (error) {
      console.error('Error resetting password:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Staff Management
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Total {staff.length} staff members
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-secondary shadow-lg hover:shadow-xl transition-shadow">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Staff Member</DialogTitle>
              <DialogDescription>
                Enter staff details. VIN ID will be auto-generated.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Full Name *</Label>
                <Input
                  value={newStaff.full_name}
                  onChange={(e) => setNewStaff({ ...newStaff, full_name: e.target.value })}
                  placeholder="John Doe"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  placeholder="staff@school.edu.ng"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Department *</Label>
                  <Select onValueChange={(v) => setNewStaff({ ...newStaff, department: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Position</Label>
                  <Input
                    value={newStaff.position}
                    onChange={(e) => setNewStaff({ ...newStaff, position: e.target.value })}
                    placeholder="Teacher / Admin"
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Qualification</Label>
                  <Input
                    value={newStaff.qualification}
                    onChange={(e) => setNewStaff({ ...newStaff, qualification: e.target.value })}
                    placeholder="B.Ed, M.Sc, etc."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                    placeholder="+234 XXX XXX XXXX"
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label>Address</Label>
                <Input
                  value={newStaff.address}
                  onChange={(e) => setNewStaff({ ...newStaff, address: e.target.value })}
                  placeholder="Staff address"
                  className="mt-1"
                />
              </div>
              <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
                <p className="text-xs text-primary/80 flex items-center gap-2">
                  <Shield className="h-3 w-3" />
                  <strong>Auto-generated credentials:</strong> VIN ID will be created automatically and used as initial password.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
              <Button onClick={handleAddStaffClick} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Add Staff
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, VIN ID, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-8"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Staff Table */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-b">
                <TableHead className="font-semibold">Staff Member</TableHead>
                <TableHead className="font-semibold">VIN ID</TableHead>
                <TableHead className="font-semibold">Department</TableHead>
                <TableHead className="font-semibold">Position</TableHead>
                <TableHead className="font-semibold">Phone</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-12 w-12 text-muted-foreground/30" />
                      <p className="text-muted-foreground">No staff members found</p>
                      <p className="text-sm text-muted-foreground">
                        {searchQuery ? 'Try a different search term' : 'Click "Add Staff" to get started'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredStaff.map((member) => (
                  <TableRow key={member.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                          <AvatarImage src={member.photo_url} />
                          <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/5 text-primary font-medium">
                            {member.full_name?.charAt(0) || 'S'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{member.full_name}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{member.vin_id}</code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {member.department || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{member.position || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{member.phone || '-'}</span>
                    </TableCell>
                    <TableCell>
                      {member.is_active ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-red-100 text-red-800 hover:bg-red-100">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => { setSelectedStaff(member); setShowEditDialog(true) }}>
                            <Edit className="mr-2 h-4 w-4" /> Edit Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleResetPasswordClick(member)}>
                            <KeyRound className="mr-2 h-4 w-4" /> Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="mr-2 h-4 w-4" /> Send Message
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDeleteStaffClick(member)} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Edit Staff Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>Update staff information</DialogDescription>
          </DialogHeader>
          {selectedStaff && (
            <div className="space-y-4 py-4">
              <div>
                <Label>Full Name</Label>
                <Input
                  value={selectedStaff.full_name}
                  onChange={(e) => setSelectedStaff({ ...selectedStaff, full_name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={selectedStaff.email}
                  disabled
                  className="mt-1 bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Department</Label>
                  <Select 
                    value={selectedStaff.department} 
                    onValueChange={(v) => setSelectedStaff({ ...selectedStaff, department: v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Position</Label>
                  <Input
                    value={selectedStaff.position}
                    onChange={(e) => setSelectedStaff({ ...selectedStaff, position: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Qualification</Label>
                  <Input
                    value={selectedStaff.qualification}
                    onChange={(e) => setSelectedStaff({ ...selectedStaff, qualification: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={selectedStaff.phone}
                    onChange={(e) => setSelectedStaff({ ...selectedStaff, phone: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label>Address</Label>
                <Input
                  value={selectedStaff.address}
                  onChange={(e) => setSelectedStaff({ ...selectedStaff, address: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <div className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedStaff.is_active}
                    onChange={(e) => setSelectedStaff({ ...selectedStaff, is_active: e.target.checked })}
                    className="sr-only peer"
                    id="active-toggle"
                  />
                  <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  <Label htmlFor="active-toggle" className="ml-3 cursor-pointer">
                    Active Account
                  </Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdateStaffClick} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}