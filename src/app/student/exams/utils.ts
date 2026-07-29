// src/app/student/exams/utils.ts - COMPLETE FIXED VERSION

import { SUBJECT_CONFIG, DEFAULT_SUBJECT_CONFIG, SUBJECTS_BY_DEPARTMENT, getSubjectsByDepartment, getSubjectCountByDepartment, getSubjectCountByClassLevel } from "./constants"
import type { SubjectConfig } from "./types"
import { supabase } from "@/lib/supabase"

// ============================================
// ✅ DYNAMIC SUBJECT COUNT - BASED ON CLASS LEVEL
// ============================================
export { getSubjectCountByClassLevel } from "./constants"

// ============================================
// ✅ GET SUBJECTS BY DEPARTMENT
// ============================================
export { getSubjectsByDepartment } from "./constants"

// ============================================
// ✅ GET SUBJECT COUNT BY DEPARTMENT
// ============================================
export { getSubjectCountByDepartment } from "./constants"

// ============================================
// ✅ SUBJECT COUNT - WITH DEPARTMENT SUPPORT
// ============================================
export function getSubjectCountWithDepartment(className: string, department: string): number {
  if (!className) return 0
  
  const normalizedClass = className.trim().toUpperCase().replace(/\s/g, '')
  
  // JSS classes - 17 subjects
  if (normalizedClass.includes('JSS1') || 
      normalizedClass.includes('JSS2') || 
      normalizedClass.includes('JSS3')) {
    return 17
  }
  
  // SS classes - use department-specific count
  if (normalizedClass.includes('SS1') || 
      normalizedClass.includes('SS2') || 
      normalizedClass.includes('SS3')) {
    const subjects = getSubjectsByDepartment(department)
    return subjects.length || 10 // Fallback to 10
  }
  
  return 0
}

// ============================================
// ✅ SUBJECT COUNT - PRIORITY: CLASS LEVEL FIRST
// ============================================
export async function getSubjectCountForClass(className: string, department?: string): Promise<number> {
  if (!className) return 0
  
  try {
    // ✅ PRIORITY 1: Use class-level count (JSS=17, SS=10)
    const classLevelCount = getSubjectCountByClassLevel(className)
    if (classLevelCount > 0) {
      console.log(`📊 Using class-level count: ${classLevelCount} for ${className}`)
      return classLevelCount
    }

    // ✅ PRIORITY 2: Get from exams table as fallback
    const { data: exams, error: examsError } = await supabase
      .from('exams')
      .select('subject')
      .eq('class', className)
      .not('subject', 'is', null)
    
    if (!examsError && exams && exams.length > 0) {
      const uniqueSubjects = new Set(exams.map((e: any) => e.subject))
      const dbCount = uniqueSubjects.size
      if (dbCount > 0) {
        console.log(`📊 Using exams count: ${dbCount} for ${className}`)
        return dbCount
      }
    }

    // ✅ PRIORITY 3: Use department-specific count for SS classes
    const normalizedClass = className.trim().toUpperCase().replace(/\s/g, '')
    if (normalizedClass.includes('SS1') || 
        normalizedClass.includes('SS2') || 
        normalizedClass.includes('SS3')) {
      if (department) {
        const deptSubjects = getSubjectsByDepartment(department)
        return deptSubjects.length || 10
      }
      return 10
    }
    
    return 0
  } catch (error) {
    console.error('Error fetching subject count:', error)
    return getSubjectCountByClassLevel(className)
  }
}

// ============================================
// ✅ SUBJECT COUNT - SYNCHRONOUS VERSION (FOR UI)
// ============================================
export function getSubjectCountSync(className: string, department?: string): number {
  if (!className) return 0
  
  const normalizedClass = className.trim().toUpperCase().replace(/\s/g, '')
  
  // JSS classes - 17 subjects
  if (normalizedClass.includes('JSS1') || 
      normalizedClass.includes('JSS2') || 
      normalizedClass.includes('JSS3')) {
    return 17
  }
  
  // SS classes - use department or default to 10
  if (normalizedClass.includes('SS1') || 
      normalizedClass.includes('SS2') || 
      normalizedClass.includes('SS3')) {
    if (department) {
      const deptSubjects = getSubjectsByDepartment(department)
      return deptSubjects.length || 10
    }
    return 10
  }
  
  return 0
}

// ============================================
// ✅ GRADE CALCULATION - FROM DATABASE
// ============================================
export async function calculateGradeFromDB(percentage: number): Promise<{ grade: string; color: string }> {
  try {
    const { data, error } = await supabase
      .from('grade_system')
      .select('grade, color, min_score, max_score')
      .gte('min_score', percentage)
      .lte('max_score', percentage)
      .single()
    
    if (error || !data) {
      console.warn('No grade found for percentage:', percentage)
      return { grade: 'N/A', color: 'text-gray-400' }
    }
    
    return { 
      grade: data.grade, 
      color: data.color || 'text-gray-600' 
    }
  } catch (error) {
    console.error('Error fetching grade:', error)
    return { grade: 'N/A', color: 'text-gray-400' }
  }
}

// ============================================
// ✅ GRADE CALCULATION - SYNCHRONOUS FALLBACK
// ============================================
export function calculateGrade(percentage: number): { grade: string; color: string } {
  if (percentage >= 80) return { grade: "A", color: "text-emerald-600" }
  if (percentage >= 70) return { grade: "B", color: "text-blue-600" }
  if (percentage >= 60) return { grade: "C", color: "text-amber-600" }
  if (percentage >= 50) return { grade: "P", color: "text-orange-600" }
  return { grade: "F", color: "text-red-600" }
}

// ============================================
// ✅ WAEC GRADE - FROM DATABASE
// ============================================
export async function calculateWAECGradeFromDB(percentage: number): Promise<{ grade: string; color: string }> {
  try {
    const { data, error } = await supabase
      .from('grade_system_waec')
      .select('grade, color, min_score, max_score')
      .gte('min_score', percentage)
      .lte('max_score', percentage)
      .single()
    
    if (error || !data) {
      console.warn('No WAEC grade found for percentage:', percentage)
      return { grade: 'N/A', color: 'text-gray-400' }
    }
    
    return { 
      grade: data.grade, 
      color: data.color || 'text-gray-600' 
    }
  } catch (error) {
    console.error('Error fetching WAEC grade:', error)
    return { grade: 'N/A', color: 'text-gray-400' }
  }
}

// ============================================
// ✅ WAEC GRADE - SYNCHRONOUS FALLBACK
// ============================================
export function calculateWAECGrade(percentage: number): { grade: string; color: string; bgColor: string } {
  if (percentage >= 75) return { grade: "A1", color: "text-emerald-600", bgColor: "bg-emerald-100" }
  if (percentage >= 70) return { grade: "B2", color: "text-blue-600", bgColor: "bg-blue-100" }
  if (percentage >= 65) return { grade: "B3", color: "text-sky-600", bgColor: "bg-sky-100" }
  if (percentage >= 60) return { grade: "C4", color: "text-teal-600", bgColor: "bg-teal-100" }
  if (percentage >= 55) return { grade: "C5", color: "text-amber-600", bgColor: "bg-amber-100" }
  if (percentage >= 50) return { grade: "C6", color: "text-orange-500", bgColor: "bg-orange-100" }
  if (percentage >= 45) return { grade: "D7", color: "text-yellow-600", bgColor: "bg-yellow-100" }
  if (percentage >= 40) return { grade: "E8", color: "text-red-400", bgColor: "bg-red-100" }
  return { grade: "F9", color: "text-red-600", bgColor: "bg-red-100" }
}

// ============================================
// ✅ WAEC GRADE COLOR FOR BADGES
// ============================================
export function getWAECGradeColor(grade: string): string {
  switch (grade) {
    case 'A1': return 'bg-emerald-500'
    case 'B2': return 'bg-blue-500'
    case 'B3': return 'bg-sky-500'
    case 'C4': return 'bg-teal-500'
    case 'C5': return 'bg-amber-500'
    case 'C6': return 'bg-orange-500'
    case 'D7': return 'bg-yellow-500'
    case 'E8': return 'bg-red-400'
    case 'F9': return 'bg-red-600'
    default: return 'bg-gray-500'
  }
}

// ============================================
// ✅ SUBJECT CONFIG - FROM DATABASE
// ============================================
export async function getSubjectConfigFromDB(subject: string): Promise<SubjectConfig | null> {
  try {
    const { data, error } = await supabase
      .from('subject_config')
      .select('icon, color, bg_color, label')
      .eq('subject', subject)
      .single()
    
    if (error || !data) {
      console.warn('No subject config found for:', subject)
      return null
    }
    
    return {
      icon: data.icon,
      color: data.color,
      bgColor: data.bg_color,
      label: data.label || subject
    }
  } catch (error) {
    console.error('Error fetching subject config:', error)
    return null
  }
}

// ============================================
// ✅ SUBJECT CONFIG - SYNCHRONOUS FALLBACK
// ============================================
export function getSubjectConfig(subject: string): SubjectConfig {
  const localConfig = SUBJECT_CONFIG[subject]
  if (localConfig) {
    return localConfig
  }
  return DEFAULT_SUBJECT_CONFIG
}

// ============================================
// ✅ CURRENT TERM - FROM DATABASE (USING TERMS TABLE)
// ============================================
export async function getCurrentTermSessionFromDB(): Promise<{ term: string; session: string }> {
  try {
    const { data, error } = await supabase
      .from('terms')
      .select('term_code, session_year')
      .eq('is_current', true)
      .single()

    if (error || !data) {
      console.error('Error fetching current term:', error)
      const { data: settings, error: settingsError } = await supabase
        .from('school_settings')
        .select('current_term, current_session')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      if (!settingsError && settings) {
        return {
          term: settings.current_term,
          session: settings.current_session
        }
      }
      
      return { term: '', session: '' }
    }

    return {
      term: data.term_code,
      session: data.session_year
    }
  } catch (error) {
    console.error('Error fetching current term:', error)
    return { term: '', session: '' }
  }
}

// ============================================
// ✅ CURRENT TERM - SYNCHRONOUS FALLBACK (DEPRECATED)
// ============================================
export function getCurrentTermSession(): { term: string; session: string } {
  console.warn('getCurrentTermSession() should not be used - use getCurrentTermSessionFromDB()')
  return { term: '', session: '' }
}

// ============================================
// ✅ TERM LABEL - FROM DATABASE
// ============================================
export async function getTermLabelFromDB(termCode: string, sessionYear: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('terms')
      .select('term_name')
      .eq('term_code', termCode)
      .eq('session_year', sessionYear)
      .single()
    
    if (error || !data) {
      console.warn('No term label found for:', termCode, sessionYear)
      return `${termCode.charAt(0).toUpperCase() + termCode.slice(1)} Term ${sessionYear}`
    }
    
    return `${data.term_name} ${sessionYear}`
  } catch (error) {
    console.error('Error fetching term label:', error)
    return `${termCode} ${sessionYear}`
  }
}

// ============================================
// ✅ TERM LABEL - SYNCHRONOUS FALLBACK
// ============================================
export function getTermLabel(term: string, sessionYear: string): string {
  const names: Record<string, string> = { 
    first: "First Term", 
    second: "Second Term", 
    third: "Third Term" 
  }
  return (names[term] || term) + " " + sessionYear
}

// ============================================
// ✅ GET ALL TERMS FROM DATABASE
// ============================================
export async function getAllTermsFromDB(): Promise<Array<{ term_code: string; term_name: string; session_year: string; is_current: boolean }>> {
  try {
    const { data, error } = await supabase
      .from('terms')
      .select('term_code, term_name, session_year, is_current')
      .order('session_year', { ascending: false })
      .order('term_code', { ascending: true })
    
    if (error || !data) {
      console.error('Error fetching all terms:', error)
      return []
    }
    
    return data
  } catch (error) {
    console.error('Error fetching all terms:', error)
    return []
  }
}

// ============================================
// ✅ GET TERM OPTIONS FOR DROPDOWN
// ============================================
export async function getTermOptionsFromDB(): Promise<Array<{ value: string; label: string; is_current: boolean }>> {
  try {
    const terms = await getAllTermsFromDB()
    return terms.map(term => ({
      value: `${term.term_code}|${term.session_year}`,
      label: `${term.term_name} ${term.session_year}`,
      is_current: term.is_current
    }))
  } catch (error) {
    console.error('Error getting term options:', error)
    return []
  }
}

// ============================================
// ✅ CLASS YEAR EXTRACTION
// ============================================
export function extractYear(className: string): string {
  if (!className) return ''
  const normalized = className.trim().toUpperCase().replace(/\s/g, '')
  
  if (['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'].includes(normalized)) {
    return normalized
  }
  
  if (normalized.includes('JSS1')) return 'JSS1'
  if (normalized.includes('JSS2')) return 'JSS2'
  if (normalized.includes('JSS3')) return 'JSS3'
  if (normalized.includes('SS1')) return 'SS1'
  if (normalized.includes('SS2')) return 'SS2'
  if (normalized.includes('SS3')) return 'SS3'
  
  return className
}

// ============================================
// ✅ NORMALIZE CLASS NAME
// ============================================
export function normalizeClassName(className: string): string {
  return className.replace(/\s+/g, "").toUpperCase()
}

// ============================================
// ✅ SUBJECT COUNT BY CLASS - CACHED VERSION
// ============================================
const subjectCountCache = new Map<string, number>()

export async function getSubjectCountCached(className: string, department?: string): Promise<number> {
  const key = `${className}|${department || ''}`
  if (subjectCountCache.has(key)) {
    return subjectCountCache.get(key)!
  }
  
  const count = await getSubjectCountForClass(className, department)
  subjectCountCache.set(key, count)
  return count
}

// ============================================
// ✅ GRADE CACHED VERSION
// ============================================
const gradeCache = new Map<number, { grade: string; color: string }>()

export async function getGradeCached(percentage: number): Promise<{ grade: string; color: string }> {
  const key = Math.round(percentage)
  if (gradeCache.has(key)) {
    return gradeCache.get(key)!
  }
  
  const grade = await calculateGradeFromDB(percentage)
  gradeCache.set(key, grade)
  return grade
}