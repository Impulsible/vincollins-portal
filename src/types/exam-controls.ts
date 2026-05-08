// types/exam-controls.ts

export type TeacherAction = 
  | 'pause_exam'
  | 'resume_exam'
  | 'reset_warnings'
  | 'extend_time'
  | 'send_encouragement'
  | 'force_fullscreen'
  | 'allow_break'
  | 'end_break'

export interface TeacherCommand {
  id: string
  attempt_id: string
  action: TeacherAction
  message?: string
  extra_time_minutes?: number
  created_by: string
  created_at: string
  executed: boolean
}

export interface ExamOverride {
  id: string
  attempt_id: string
  is_paused: boolean
  extra_time_minutes: number
  warning_reset_count: number
  updated_at: string
  updated_by: string
}

export interface TeacherNotification {
  id: string
  attempt_id: string
  type: string
  details: string
  timestamp: string
  acknowledged: boolean
}