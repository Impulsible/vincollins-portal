// src/app/student/exams/constants.ts
import {
  MonitorPlay, FileText, Award, BookOpen, Shield, PenTool,
  Hash, Target, Zap, TrendingUp, BarChart3
} from 'lucide-react'
import type { SubjectConfig } from './types'

export const SUBJECT_CONFIG: Record<string, SubjectConfig> = {
  'Mathematics': { icon: Hash, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  'English Language': { icon: BookOpen, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  'Physics': { icon: Zap, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  'Chemistry': { icon: FileText, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  'Biology': { icon: Target, color: 'text-green-600', bgColor: 'bg-green-50' },
  'Economics': { icon: TrendingUp, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  'Government': { icon: Shield, color: 'text-red-600', bgColor: 'bg-red-50' },
  'Literature in English': { icon: PenTool, color: 'text-pink-600', bgColor: 'bg-pink-50' },
  'Commerce': { icon: BarChart3, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  'Information Technology': { icon: MonitorPlay, color: 'text-slate-600', bgColor: 'bg-slate-50' },
  'Civic Education': { icon: Shield, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  'Christian Religious Studies': { icon: BookOpen, color: 'text-sky-600', bgColor: 'bg-sky-50' },
  'Basic Science': { icon: Zap, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  'Basic Technology': { icon: MonitorPlay, color: 'text-slate-600', bgColor: 'bg-slate-50' },
  'Social Studies': { icon: BookOpen, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  'Business Studies': { icon: BarChart3, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  'Agricultural Science': { icon: Target, color: 'text-green-600', bgColor: 'bg-green-50' },
  'Physical and Health Education': { icon: Target, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  'History': { icon: BookOpen, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  'Geography': { icon: Target, color: 'text-teal-600', bgColor: 'bg-teal-50' },
  'Further Mathematics': { icon: Hash, color: 'text-violet-600', bgColor: 'bg-violet-50' },
  'Data Processing': { icon: PenTool, color: 'text-gray-600', bgColor: 'bg-gray-50' },
}

export const TERM_NAMES: Record<string, string> = {
  first: 'First Term',
  second: 'Second Term',
  third: 'Third Term'
}

export const CURRENT_SESSION = '2025/2026'

export const DEFAULT_SUBJECT_CONFIG: SubjectConfig = {
  icon: BookOpen,
  color: 'text-gray-600',
  bgColor: 'bg-gray-50'
}