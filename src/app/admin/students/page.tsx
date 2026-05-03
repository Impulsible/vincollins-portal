// app/admin/students/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { StudentManagement } from '@/components/admin/students/StudentManagement'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface Student {
  id: string
  vin_id: string
  email: string
  full_name: string
  display_name?: string
  first_name?: string
  middle_name?: string
  last_name?: string
  class: string
  department: string
  is_active: boolean
  password_changed: boolean
  created_at: string
  photo_url?: string
  last_seen?: string
  admission_year?: number
  phone?: string
  address?: string
}

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
      setStudents((data as Student[]) || [])
    } catch (error) {
      console.error('Error fetching students:', error)
      toast.error('Failed to load students')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  return (
    <div className="p-6">
      <StudentManagement
        students={students}
        onRefresh={fetchStudents}
        loading={loading}
      />
    </div>
  )
}