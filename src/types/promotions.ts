// types/promotions.ts
export type StudentClass =
  | 'JSS 1'
  | 'JSS 2'
  | 'JSS 3'
  | 'SS1 Science'
  | 'SS1 Arts'
  | 'SS1 Commercial'
  | 'SS2 Science'
  | 'SS2 Arts'
  | 'SS2 Commercial'
  | 'SS3 Science'
  | 'SS3 Arts'
  | 'SS3 Commercial'

export type Department = 'Science' | 'Arts' | 'Commercial'

export type PromotionStatus = 'pending' | 'approved' | 'rejected'

export type UserRole = 'admin' | 'staff' | 'student' | 'parent'

export interface Promotion {
  id: string
  student_id: string
  student_name: string
  current_class: StudentClass
  next_class: StudentClass
  status: PromotionStatus
  created_at: string
}

export interface PromotionStats {
  total: number
  pending: number
  approved: number
  rejected: number
}

export type ActionResult<T = undefined> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: string }