// app/admin/staff/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { StaffManagement } from '@/components/admin/staff/StaffManagement'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

// Interface matching the Staff type in StaffManagement component
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

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch staff members
  const fetchStaff = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['staff', 'teacher', 'admin'])
        .order('full_name', { ascending: true })

      if (error) throw error
      setStaff((data as Staff[]) || [])
    } catch (error) {
      console.error('Error fetching staff:', error)
      toast.error('Failed to load staff members')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStaff()
  }, [fetchStaff])

  // Handle adding a new staff member
  const handleAddStaff = async (staffData: any): Promise<{ email: string; password: string; vin_id: string }> => {
    try {
      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...staffData,
          role: 'staff',
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create staff member')
      }

      return {
        email: result.credentials.email,
        password: result.credentials.password,
        vin_id: result.credentials.vin_id,
      }
    } catch (error: any) {
      console.error('Error adding staff:', error)
      toast.error(error.message || 'Failed to add staff member')
      throw error
    }
  }

  // Handle updating a staff member
  const handleUpdateStaff = async (updatedStaff: Staff): Promise<void> => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: updatedStaff.full_name,
          department: updatedStaff.department,
          phone: updatedStaff.phone,
          address: updatedStaff.address,
          is_active: updatedStaff.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', updatedStaff.id)

      if (error) throw error

      await fetchStaff()
    } catch (error: any) {
      console.error('Error updating staff:', error)
      toast.error(error.message || 'Failed to update staff member')
      throw error
    }
  }

  // Handle deleting a staff member
  const handleDeleteStaff = async (staffMember: Staff): Promise<void> => {
    try {
      // Delete from auth.users via API (if you have one) or admin SDK
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', staffMember.id)

      if (profileError) throw profileError

      await fetchStaff()
    } catch (error: any) {
      console.error('Error deleting staff:', error)
      toast.error(error.message || 'Failed to delete staff member')
      throw error
    }
  }

  // Handle resetting password
  const handleResetPassword = async (staffMember: Staff): Promise<void> => {
    try {
      const { error } = await supabase.auth.admin.updateUserById(
        staffMember.id,
        { password: staffMember.vin_id }
      )

      if (error) throw error

      toast.success(`Password reset to VIN ID: ${staffMember.vin_id}`)
    } catch (error: any) {
      console.error('Error resetting password:', error)
      toast.error(error.message || 'Failed to reset password')
      throw error
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-32 bg-muted animate-pulse rounded mt-1" />
          </div>
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-96 bg-muted animate-pulse rounded-xl" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <StaffManagement
        staff={staff}
        onAddStaff={handleAddStaff}
        onUpdateStaff={handleUpdateStaff}
        onDeleteStaff={handleDeleteStaff}
        onResetPassword={handleResetPassword}
        onRefresh={fetchStaff}
      />
    </div>
  )
}