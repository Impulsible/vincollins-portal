// components/admin/students/hooks/useStudentActions.ts

'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Student, StudentFormData, Credentials, BulkUploadResult } from '../types'
import { formatFullName, parseCSV } from '../utils'
import { CURRENT_YEAR } from '../constants'

interface UseStudentActionsReturn {
  isSubmitting: boolean
  createStudent: (formData: StudentFormData) => Promise<Credentials | null>
  updateStudent: (student: Student) => Promise<boolean>
  deleteStudent: (student: Student) => Promise<boolean>
  bulkUploadStudents: (file: File) => Promise<BulkUploadResult | null>
}

export function useStudentActions(onRefresh: () => void): UseStudentActionsReturn {
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ============================================
  // CREATE STUDENT
  // ============================================
  const createStudent = useCallback(async (formData: StudentFormData): Promise<Credentials | null> => {
    if (!formData.first_name || !formData.last_name || !formData.class) {
      toast.error('Please fill in all required fields (First name, Last name, Class)')
      return null
    }

    if (!formData.admission_number) {
      toast.error('Please enter an Admission Number')
      return null
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.first_name.trim(),
          middle_name: formData.middle_name?.trim() || '',
          last_name: formData.last_name.trim(),
          role: 'student',
          class: formData.class,
          department: formData.department || 'General',
          admission_year: formData.admission_year,
          admission_number: formData.admission_number.trim(),
          phone: formData.phone || '',
          address: formData.address || '',
          gender: formData.gender,
          date_of_birth: formData.date_of_birth || null,
          next_term_begins: formData.next_term_begins || null,
        }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to create student')

      const fullName = formatFullName(
        formData.first_name,
        formData.last_name,
        formData.middle_name
      )
      toast.success(`${fullName} created successfully!`)
      onRefresh()

      return result.credentials as Credentials
    } catch (error: any) {
      console.error('❌ Create student error:', error)
      toast.error(error.message || 'Failed to create student')
      return null
    } finally {
      setIsSubmitting(false)
    }
  }, [onRefresh])

  // ============================================
  // UPDATE STUDENT - FIXED (No refresh)
  // ============================================
  const updateStudent = useCallback(async (student: Student): Promise<boolean> => {
    if (!student || !student.id) {
      console.error('❌ No student or student ID provided')
      toast.error('Invalid student data')
      return false
    }

    setIsSubmitting(true)
    try {
      console.log('🔄 Updating student via API:', student.id)

      // ✅ Build update payload
      const updatePayload: Record<string, any> = {
        id: student.id,
        first_name: student.first_name || '',
        last_name: student.last_name || '',
        full_name: student.full_name || `${student.first_name} ${student.last_name}`,
        display_name: student.display_name || student.full_name || '',

        class: student.class || null,
        department: student.department || 'General',
        is_active: student.is_active ?? true,
        admission_year: student.admission_year || null,
        admission_number: student.admission_number || null,

        phone: student.phone || null,
        address: student.address || null,

        gender: student.gender || null,
        date_of_birth: student.date_of_birth || null,
        next_term_begins: student.next_term_begins || null,
      }

      // Handle middle_name
      if (student.middle_name && student.middle_name.trim()) {
        updatePayload.middle_name = student.middle_name.trim()
      } else {
        updatePayload.middle_name = null
      }

      console.log('📤 Sending to API:', updatePayload)

      // ✅ Use API endpoint instead of direct Supabase
      const response = await fetch('/api/admin/users/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      })

      const result = await response.json()
      
      console.log('📥 API response:', result)

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update student')
      }

      console.log('✅ Update successful:', result.user)
      toast.success(`${student.full_name || student.first_name} updated successfully!`)
      
      // ✅ Only refresh if needed (remove if causing issues)
      // onRefresh()
      
      return true
    } catch (error: any) {
      console.error('❌ Update student error:', error)
      toast.error(error.message || 'Failed to update student')
      return false
    } finally {
      setIsSubmitting(false)
    }
  }, []) // ✅ Remove onRefresh dependency

  // ============================================
  // DELETE STUDENT
  // ============================================
  const deleteStudent = useCallback(async (student: Student): Promise<boolean> => {
    if (!student || !student.id) {
      console.error('❌ No student or student ID provided')
      toast.error('Invalid student data')
      return false
    }

    setIsSubmitting(true)
    try {
      console.log('🗑️ Deleting student:', student.id)

      const { data, error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', student.id)
        .select()

      console.log('📥 Delete response:', { data, error })

      if (error) {
        console.error('❌ Profile delete error:', error)
        toast.error(`Database error: ${error.message}`)
        return false
      }

      console.log('✅ Student deleted successfully')
      toast.success('Student deleted successfully')
      onRefresh()
      return true
    } catch (error: any) {
      console.error('❌ Delete student error:', error)
      toast.error(error.message || 'Failed to delete student')
      return false
    } finally {
      setIsSubmitting(false)
    }
  }, [onRefresh])

  // ============================================
  // BULK UPLOAD STUDENTS
  // ============================================
  const bulkUploadStudents = useCallback(async (file: File): Promise<BulkUploadResult | null> => {
    setIsSubmitting(true)
    try {
      const text = await file.text()
      const students = parseCSV(text)

      const results: BulkUploadResult = {
        success: 0,
        failed: 0,
        errors: [],
        students: [],
      }

      for (const student of students) {
        try {
          const response = await fetch('/api/admin/users/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              first_name: student.first_name.trim(),
              middle_name: student.middle_name?.trim() || '',
              last_name: student.last_name.trim(),
              role: 'student',
              class: student.class,
              department: student.department || 'General',
              admission_year: parseInt(student.admission_year || '') || CURRENT_YEAR,
              admission_number: student.admission_number?.trim() || '',
              phone: student.phone || '',
              address: student.address || '',
              gender: student.gender || 'male',
              date_of_birth: student.date_of_birth || null,
              next_term_begins: student.next_term_begins || null,
            }),
          })

          const result = await response.json()
          if (!response.ok) throw new Error(result.error || 'Failed')

          results.success++
          results.students.push({
            full_name: result.user.full_name,
            email: result.credentials.email,
            vin_id: result.credentials.vin_id,
            admission_number: result.credentials.admission_number,
            class: student.class,
          })
        } catch (error: any) {
          results.failed++
          results.errors.push({
            line: student._line || 0,
            student: `${student.first_name} ${student.last_name}`,
            error: error.message,
          })
        }
        await new Promise(resolve => setTimeout(resolve, 300))
      }

      if (results.success > 0) {
        toast.success(`${results.success} students created!`)
      }
      if (results.failed > 0) {
        toast.error(`${results.failed} students failed`)
      }
      onRefresh()
      return results
    } catch (error: any) {
      console.error('❌ Bulk upload error:', error)
      toast.error(error.message || 'Bulk upload failed')
      return null
    } finally {
      setIsSubmitting(false)
    }
  }, [onRefresh])

  return {
    isSubmitting,
    createStudent,
    updateStudent,
    deleteStudent,
    bulkUploadStudents,
  }
}