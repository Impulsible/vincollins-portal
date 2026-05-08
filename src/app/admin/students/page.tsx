// app/admin/students/page.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import { StudentManagement } from '@/components/admin/students/StudentManagement'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

// ✅ Use the shared Student type from the component
import type { Student } from '@/components/admin/students/types'

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  const fetchStudents = useCallback(async () => {
    console.log('🔄 Fetching students...')
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('full_name', { ascending: true })

      if (error) {
        console.error('❌ Fetch error:', error)
        throw error
      }

      console.log(`✅ Fetched ${data?.length || 0} students`)
      
      if (data && data.length > 0) {
        console.log('📋 Students:', data.map((s: any) => ({
          name: s.full_name,
          class: s.class,
          admission: s.admission_number,
          role: s.role
        })))
      }

      // ✅ Map all fields from database
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
        is_active: profile.is_active ?? true,
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