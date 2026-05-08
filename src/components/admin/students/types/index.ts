// components/admin/students/types/index.ts

// ============================================
// PRESENCE TYPES
// ============================================

export interface PresenceEvent {
  user_id: string
  status?: 'online' | 'away'
  last_seen?: string
  role?: string
  [key: string]: any
}

export type PresenceStatus = 'online' | 'away' | 'offline'

// ============================================
// STUDENT TYPES
// ============================================

export interface Student {
  id: string
  vin_id: string                    // Auto-generated: VIN-STD-2026-6453
  admission_number?: string         // Manually entered: 2025VIN62
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
  gender?: 'male' | 'female' | 'other'
  date_of_birth?: string
  next_term_begins?: string
}

// ============================================
// FORM TYPES
// ============================================

export interface StudentFormData {
  first_name: string
  middle_name: string
  last_name: string
  class: string
  department: string
  admission_year: number
  admission_number: string          // ✅ Manual input field
  phone: string
  address: string
  gender: 'male' | 'female' | 'other'
  date_of_birth: string
  next_term_begins: string
}

export interface Credentials {
  email: string
  password: string
  vin_id: string                    // Auto-generated: VIN-STD-2026-6453
  admission_number: string          // Manually entered: 2025VIN62
}

// ============================================
// VIEW TYPES
// ============================================

export type ViewMode = 'classes' | 'list'

export interface ClassGroup {
  students: Student[]
  count: number
  onlineCount: number
}

// ============================================
// BULK UPLOAD TYPES
// ============================================

export interface BulkUploadRow {
  _line: number
  first_name: string
  middle_name?: string
  last_name: string
  class: string
  department?: string
  admission_year?: string
  admission_number?: string         // ✅ Optional in bulk upload
  gender?: string
  date_of_birth?: string
  next_term_begins?: string
  phone?: string
  address?: string
}

export interface BulkUploadResult {
  success: number
  failed: number
  errors: Array<{ line: number; student: string; error: string }>
  students: Array<{
    full_name: string
    email: string
    vin_id: string
    admission_number: string
    class: string
  }>
}

// ============================================
// COMPONENT PROPS
// ============================================

export interface StudentManagementProps {
  students: Student[]
  onRefresh: () => void
  loading?: boolean
}