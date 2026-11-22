// src/app/student/exams/constants.ts - COMPLETE FIXED VERSION

import {
  MonitorPlay, FileText, Award, BookOpen, Shield, PenTool,
  Hash, Target, Zap, TrendingUp, BarChart3, Music, 
  Palette, Globe, Languages, School, Calculator, Brain, 
  Trophy, Users, Briefcase, Film, Camera, Microscope,
  Database, Code, Cloud, Wifi, Lock, Key, Clock,
  Gift, Heart, Star, Sun, Moon, Leaf, Droplet,
  Flame, Compass, Map, Flag, Crown, Gem, Sparkles
} from 'lucide-react'
import type { SubjectConfig } from './types'

export const SUBJECT_CONFIG: Record<string, SubjectConfig> = {
  // ============================================
  // CORE SUBJECTS
  // ============================================
  'Mathematics': { icon: Hash, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  'Maths': { icon: Hash, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  'Math': { icon: Hash, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  'English Language': { icon: BookOpen, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  'English Studies': { icon: BookOpen, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  'English': { icon: BookOpen, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  
  // ============================================
  // SCIENCE SUBJECTS
  // ============================================
  'Physics': { icon: Zap, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  'Chemistry': { icon: FileText, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  'Biology': { icon: Target, color: 'text-green-600', bgColor: 'bg-green-50' },
  'Basic Science': { icon: Zap, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  'Basic Technology': { icon: MonitorPlay, color: 'text-slate-600', bgColor: 'bg-slate-50' },
  'Agricultural Science': { icon: Leaf, color: 'text-green-600', bgColor: 'bg-green-50' },
  'Agric': { icon: Leaf, color: 'text-green-600', bgColor: 'bg-green-50' },
  'Agriculture': { icon: Leaf, color: 'text-green-600', bgColor: 'bg-green-50' },
  
  // ============================================
  // SOCIAL SCIENCES
  // ============================================
  'Economics': { icon: TrendingUp, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  'Government': { icon: Shield, color: 'text-red-600', bgColor: 'bg-red-50' },
  'Social Studies': { icon: Globe, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  'Geography': { icon: Map, color: 'text-teal-600', bgColor: 'bg-teal-50' },
  'History': { icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  'Civic Education': { icon: Shield, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  'Civic': { icon: Shield, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  
  // ============================================
  // ARTS & HUMANITIES
  // ============================================
  'Literature in English': { icon: PenTool, color: 'text-pink-600', bgColor: 'bg-pink-50' },
  'Literature': { icon: PenTool, color: 'text-pink-600', bgColor: 'bg-pink-50' },
  'Lit': { icon: PenTool, color: 'text-pink-600', bgColor: 'bg-pink-50' },
  'Christian Religious Studies': { icon: BookOpen, color: 'text-sky-600', bgColor: 'bg-sky-50' },
  'CRS': { icon: BookOpen, color: 'text-sky-600', bgColor: 'bg-sky-50' },
  'CRK': { icon: BookOpen, color: 'text-sky-600', bgColor: 'bg-sky-50' },
  'Islamic Religious Studies': { icon: BookOpen, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  'IRS': { icon: BookOpen, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  'Cultural and Creative Arts': { icon: Palette, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  'Creative Arts': { icon: Palette, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  'CCA': { icon: Palette, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  
  // ============================================
  // MUSIC & PERFORMING ARTS
  // ============================================
  'Music': { icon: Music, color: 'text-pink-600', bgColor: 'bg-pink-50' },
  'Drama': { icon: Film, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  'Theatre Arts': { icon: Film, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  
  // ============================================
  // BUSINESS & COMMERCE
  // ============================================
  'Commerce': { icon: BarChart3, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  'Business Studies': { icon: Briefcase, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  'Business': { icon: Briefcase, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  'Financial Accounting': { icon: Calculator, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  'Accounting': { icon: Calculator, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  'Office Practice': { icon: Briefcase, color: 'text-slate-600', bgColor: 'bg-slate-50' },
  
  // ============================================
  // TECHNOLOGY & COMPUTING
  // ============================================
  'Information Technology': { icon: MonitorPlay, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  'IT': { icon: MonitorPlay, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  'Computer Science': { icon: MonitorPlay, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  'Data Processing': { icon: Database, color: 'text-gray-600', bgColor: 'bg-gray-50' },
  'Data': { icon: Database, color: 'text-gray-600', bgColor: 'bg-gray-50' },
  'ICT': { icon: Wifi, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  'Programming': { icon: Code, color: 'text-violet-600', bgColor: 'bg-violet-50' },
  
  // ============================================
  // LANGUAGES (LOCKED FROM SHUFFLING)
  // ============================================
  'French': { icon: Languages, color: 'text-red-600', bgColor: 'bg-red-50' },
  'Yoruba': { icon: Languages, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  'Igbo': { icon: Languages, color: 'text-green-600', bgColor: 'bg-green-50' },
  'Hausa': { icon: Languages, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
  'Arabic': { icon: Languages, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  
  // ============================================
  // HOME ECONOMICS & VOCATIONAL
  // ============================================
  'Home Economics': { icon: School, color: 'text-pink-600', bgColor: 'bg-pink-50' },
  'Home Econ': { icon: School, color: 'text-pink-600', bgColor: 'bg-pink-50' },
  'Food and Nutrition': { icon: Heart, color: 'text-red-600', bgColor: 'bg-red-50' },
  'Clothing and Textile': { icon: Gem, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  
  // ============================================
  // PHYSICAL EDUCATION
  // ============================================
  'Physical and Health Education': { icon: Trophy, color: 'text-rose-600', bgColor: 'bg-rose-50' },
  'PHE': { icon: Trophy, color: 'text-rose-600', bgColor: 'bg-rose-50' },
  'Physical Education': { icon: Trophy, color: 'text-rose-600', bgColor: 'bg-rose-50' },
  'Sports': { icon: Trophy, color: 'text-rose-600', bgColor: 'bg-rose-50' },
  
  // ============================================
  // SECURITY & SAFETY
  // ============================================
  'Security Education': { icon: Shield, color: 'text-red-600', bgColor: 'bg-red-50' },
  'Security': { icon: Shield, color: 'text-red-600', bgColor: 'bg-red-50' },
  
  // ============================================
  // ADVANCED MATH
  // ============================================
  'Further Mathematics': { icon: Hash, color: 'text-violet-600', bgColor: 'bg-violet-50' },
  'Further Maths': { icon: Hash, color: 'text-violet-600', bgColor: 'bg-violet-50' },
  'F. Maths': { icon: Hash, color: 'text-violet-600', bgColor: 'bg-violet-50' },
  
  // ============================================
  // ADDITIONAL SUBJECTS
  // ============================================
  'Psychology': { icon: Brain, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  'Sociology': { icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  'Philosophy': { icon: BookOpen, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  'Logic': { icon: Brain, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  
  // ============================================
  // VOCATIONAL & PRACTICAL
  // ============================================
  'Woodwork': { icon: PenTool, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  'Metalwork': { icon: PenTool, color: 'text-gray-600', bgColor: 'bg-gray-50' },
  'Electronics': { icon: Zap, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  'Photography': { icon: Camera, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  'Catering': { icon: Heart, color: 'text-red-600', bgColor: 'bg-red-50' },
  
  // ============================================
  // SCIENCE LABS
  // ============================================
  'Science Lab': { icon: Microscope, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  'Laboratory': { icon: Microscope, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  'Practical': { icon: Target, color: 'text-green-600', bgColor: 'bg-green-50' },
}

export const TERM_NAMES: Record<string, string> = {
  first: 'First Term',
  second: 'Second Term',
  third: 'Third Term'
}

export const DEFAULT_SUBJECT_CONFIG: SubjectConfig = {
  icon: BookOpen,
  color: 'text-gray-600',
  bgColor: 'bg-gray-50'
}

export const SUBJECTS_BY_DEPARTMENT: Record<string, string[]> = {
  'Science': [
    'English Language',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Further Mathematics',
    'Agricultural Science',
    'Geography',
    'Civic Education',
    'Data Processing'
  ],
  'Arts': [
    'English Language',
    'Mathematics',
    'Literature in English',
    'Government',
    'History',
    'CRS',
    'Economics',
    'Yoruba',
    'Civic Education',
    'Music'
  ],
  'Commercial': [
    'English Language',
    'Mathematics',
    'Economics',
    'Financial Accounting',
    'Commerce',
    'Business Studies',
    'Government',
    'CRS',
    'Civic Education',
    'Data Processing'
  ],
  'General': [
    'English Language',
    'Mathematics',
    'Basic Science',
    'Basic Technology',
    'Social Studies',
    'Civic Education',
    'Christian Religious Studies',
    'Agricultural Science',
    'Home Economics',
    'Business Studies',
    'Physical and Health Education',
    'Cultural and Creative Arts',
    'French',
    'Yoruba',
    'Music',
    'Information Technology',
    'Security Education'
  ]
}

export function getSubjectsByDepartment(department: string): string[] {
  const normalizedDept = department?.trim().toUpperCase() || ''
  
  if (normalizedDept.includes('SCIENCE')) {
    return SUBJECTS_BY_DEPARTMENT.Science
  }
  if (normalizedDept.includes('ART')) {
    return SUBJECTS_BY_DEPARTMENT.Arts
  }
  if (normalizedDept.includes('COMMERCE') || normalizedDept.includes('COMMERCIAL')) {
    return SUBJECTS_BY_DEPARTMENT.Commercial
  }
  
  return SUBJECTS_BY_DEPARTMENT.General
}

export function getSubjectCountByDepartment(department: string): number {
  return getSubjectsByDepartment(department).length
}

export function getSubjectCountByClassLevel(className: string): number {
  if (!className) return 0
  const normalizedClass = className.trim().toUpperCase().replace(/\s/g, '')
  
  if (normalizedClass.includes('JSS1') || 
      normalizedClass.includes('JSS2') || 
      normalizedClass.includes('JSS3')) {
    return 17
  }
  
  if (normalizedClass.includes('SS1') || 
      normalizedClass.includes('SS2') || 
      normalizedClass.includes('SS3')) {
    return 10
  }
  
  return 0
}

/* ============================================================
   SHUFFLE PREVENTION & RELATIVE OPTION CONSTANTS
   ============================================================ */

export function stripDiacritics(str: string): string {
  if (!str) return ''
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export const SHUFFLE_EXCLUDED_SUBJECTS: readonly string[] = [
  // Yoruba & dialects
  'yoruba',
  'ede yoruba',
  'ede',
  'yoruba language',
  'yoruba studies',

  // French & French Studies
  'french',
  'francais',
  'french language',
  'langue francaise',
  'french studies',
  'etudes francaises',

  // English & Literature
  'english',
  'english language',
  'english studies',
  'use of english',
  'general english',
  'literature',
  'literature in english',
  'literature-in-english',
  'oral english',

  // Other Nigerian & Foreign Languages
  'igbo',
  'asusu igbo',
  'igbo language',
  'hausa',
  'harshen hausa',
  'hausa language',
  'arabic',
  'arabic language',
  'german',

  // Comprehension & Aptitude
  'verbal reasoning',
  'verbal aptitude',
  'reading comprehension',
  'comprehension',
] as const

export const RELATIVE_OPTION_PHRASES: readonly string[] = [
  // English Relative Phrases
  'all of the above',
  'none of the above',
  'all the above',
  'none the above',
  'all of these',
  'none of these',
  'all the these',
  'none the these',
  'both a and b',
  'both a & b',
  'both b and c',
  'both b & c',
  'both a and c',
  'both a & c',
  'a and b only',
  'b and c only',
  'a and c only',
  'neither a nor b',
  'all the options',
  'none of the options',
  'options a and b',
  'options b and c',
  'options a & b',
  'options b & c',
  'a only',
  'b only',
  'c only',
  'd only',

  // French Relative Phrases (Normalized)
  'toutes les reponses ci-dessus',
  'toutes les reponses ci dessus',
  'toutes les propositions ci-dessus',
  'toutes les options ci-dessus',
  'tous les elements ci-dessus',
  'aucune des reponses ci-dessus',
  'aucune des reponses',
  'aucune de ces reponses',
  'aucune des options',
  'aucun des elements ci-dessus',
  'les deux a et b',
  'a et b seulement',
  'b et c seulement',
  'a et c seulement',
  'ni a ni b',
] as const

export function hasRelativeOptions(options: readonly string[] | undefined | null): boolean {
  if (!options || options.length === 0) return false

  return options.some((opt) => {
    if (!opt) return false
    const norm = stripDiacritics(String(opt))
      .toLowerCase()
      .replace(/[^a-z0-9 &]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (!norm) return false

    return RELATIVE_OPTION_PHRASES.some(
      (phrase) => norm === phrase || norm.includes(phrase),
    )
  })
}

export function isSubjectExcludedFromShuffle(
  subjectName?: string | null,
  examTitle?: string | null
): boolean {
  const combined = `${subjectName || ''} ${examTitle || ''}`.trim()
  if (!combined) return false

  const stripped = stripDiacritics(combined)
  const normalized = stripped
    .toLowerCase()
    .replace(/[._\-\/]/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')

  if (!normalized) return false

  return SHUFFLE_EXCLUDED_SUBJECTS.some((excluded) => {
    const cleanExcluded = stripDiacritics(excluded).toLowerCase().trim()
    return (
      normalized === cleanExcluded ||
      normalized.split(' ').includes(cleanExcluded) ||
      normalized.includes(cleanExcluded)
    )
  })
}