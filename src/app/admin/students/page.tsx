// app/admin/students/page.tsx - WITH DARK MODE
'use client'

import { useState, useEffect, useCallback } from 'react'
import { StudentManagement } from '@/components/admin/students/StudentManagement'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Student } from '@/components/admin/students/types'

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('full_name', { ascending: true })

      if (error) throw error

      const mappedStudents: Student[] = (data || []).map((profile: any) => ({
        id: profile.id,
        vin_id: profile.vin_id || '',
        admission_number: profile.admission_number || '',
        email: profile.email || '',
        full_name: profile.full_name || '',
        display_name: profile.display_name || profile.full_name || '',
        first_name: profile.first_name || '',
        middle_name: profile.middle_name || '',
        last_name: profile.last_name || '',
        class: profile.class || 'Not Assigned',
        department: profile.department || 'General',
        is_active: profile.is_active === false ? false : true,
        password_changed: profile.password_changed ?? false,
        created_at: profile.created_at || '',
        photo_url: profile.photo_url || profile.avatar_url || '',
        last_seen: profile.last_login || '',
        admission_year: profile.admission_year || null,
        phone: profile.phone || '',
        address: profile.address || '',
        gender: profile.gender || null,
        date_of_birth: profile.date_of_birth || null,
        next_term_begins: profile.next_term_begins || null,
      }))

      setStudents(mappedStudents)
    } catch (error: any) {
      console.error('❌ Error fetching students:', error)
      toast.error('Failed to load students')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleToggleStatus = async (studentId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ is_active: nextStatus })
        .eq('id', studentId)
        .select()

      if (error) throw error
      if (!data || data.length === 0) throw new Error('Database rejected update. Ensure your admin user has permission in Supabase RLS.')

      setStudents(prev =>
        prev.map(s => (s.id === studentId ? { ...s, is_active: nextStatus } : s))
      )

      toast.success(nextStatus ? 'Student reactivated and visible in class lists.' : 'Student marked inactive (hidden across system rosters).')
    } catch (err: any) {
      console.error('❌ Error toggling status:', err)
      toast.error(err.message || 'Failed to update status in database')
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  return (
    <div className="p-4 sm:p-6 min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <StudentManagement
        students={students}
        onRefresh={fetchStudents}
        onToggleStatus={handleToggleStatus}
        loading={loading}
      />
    </div>
  )
}