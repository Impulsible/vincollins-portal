// app/admin/staff/page.tsx - WITH DARK MODE
'use client'

import { useState, useEffect, useCallback } from 'react'
import { StaffManagement } from '@/components/admin/staff/StaffManagement'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

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

  const fetchStaff = useCallback(async () => {
    console.log('🔄 Fetching staff...')
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['staff', 'teacher', 'admin'])
        .order('full_name', { ascending: true })

      if (error) throw error
      
      console.log('✅ Staff fetched:', data?.length || 0, 'members')
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

  const handleAddStaff = async (staffData: any): Promise<{ email: string; password: string; vin_id: string } | void> => {
    console.log('ℹ️ handleAddStaff called (API handled by StaffManagement directly)')
    return
  }

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

      toast.success('Staff updated successfully!')
      await fetchStaff()
    } catch (error: any) {
      console.error('Error updating staff:', error)
      toast.error(error.message || 'Failed to update staff member')
      throw error
    }
  }

  const handleDeleteStaff = async (staffMember: Staff): Promise<void> => {
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', staffMember.id)

      if (profileError) throw profileError

      toast.success('Staff deleted successfully!')
      await fetchStaff()
    } catch (error: any) {
      console.error('Error deleting staff:', error)
      toast.error(error.message || 'Failed to delete staff member')
      throw error
    }
  }

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
      <div className="p-4 sm:p-6 space-y-6 min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 animate-pulse rounded mt-1" />
          </div>
          <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
        </div>
        <div className="h-96 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <StaffManagement
        {...({
          staff,
          onUpdateStaff: handleUpdateStaff,
          onDeleteStaff: handleDeleteStaff,
          onResetPassword: handleResetPassword,
          onRefresh: fetchStaff,
        } as any)}
      />
    </div>
  )
}