// types/subjects.ts

// ============================================
// JSS SUBJECTS - 17 Subjects
// ============================================
export const JSS_SUBJECTS: string[] = [
  'English Studies',
  'Mathematics',
  'Basic Science',
  'Basic Technology',
  'Physical and Health Education',
  'Information Technology',
  'Cultural and Creative Arts',
  'Music',
  'Home Economics',
  'Agricultural Science',
  'Yoruba',
  'French',
  'Civic Education',
  'Social Studies',
  'Security Education',
  'Christian Religious Studies',
  'Business Studies'
]

// ============================================
// SSS SCIENCE DEPARTMENT - 10 Subjects
// ============================================
export interface DepartmentSubjects {
  department: 'Science' | 'Arts' | 'Commercial'
  coreSubjects: string[]
  electiveOptions: string[]
  requiredElectives: number
}

export const SCIENCE_SUBJECTS: DepartmentSubjects = {
  department: 'Science',
  coreSubjects: [
    'English Language',
    'Mathematics',
    'Civic Education',
    'Physics',
    'Chemistry',
    'Biology'
  ],
  electiveOptions: [
    'Data Processing',
    'Agricultural Science',
    'Economics',
    'Further Mathematics',
    'Geography',
    'Computer Science',
    'Technical Drawing'
  ],
  requiredElectives: 4 // Need to choose 4 electives to make 10 total
}

// ============================================
// SSS ARTS DEPARTMENT - 10 Subjects
// ============================================
export const ARTS_SUBJECTS: DepartmentSubjects = {
  department: 'Arts',
  coreSubjects: [
    'English Language',
    'Mathematics',
    'Civic Education',
    'Literature in English',
    'Government',
    'Biology'
  ],
  electiveOptions: [
    'Christian Religious Studies',
    'Economics',
    'Data Processing',
    'Agricultural Science',
    'Geography',
    'History',
    'French',
    'Yoruba',
    'Igbo',
    'Hausa',
    'Islamic Religious Studies',
    'Commerce',
    'Music',
    'Fine Arts'
  ],
  requiredElectives: 4 // Need to choose 4 electives to make 10 total
}

// ============================================
// SSS COMMERCIAL DEPARTMENT - 10 Subjects
// ============================================
export const COMMERCIAL_SUBJECTS: DepartmentSubjects = {
  department: 'Commercial',
  coreSubjects: [
    'English Language',
    'Mathematics',
    'Civic Education',
    'Economics',
    'Commerce',
    'Financial Accounting'
  ],
  electiveOptions: [
    'Data Processing',
    'Agricultural Science',
    'Biology',
    'Geography',
    'Government',
    'Business Studies',
    'Marketing',
    'Office Practice',
    'Computer Science'
  ],
  requiredElectives: 4 // Need to choose 4 electives to make 10 total
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// Get subjects based on class and department
export function getStudentSubjects(studentClass: string, department?: string): string[] {
  // JSS students get all 17 subjects
  if (studentClass?.startsWith('JSS')) {
    return JSS_SUBJECTS
  }
  
  // SSS students get department-specific subjects
  if (studentClass?.startsWith('SS')) {
    const deptLower = department?.toLowerCase() || ''
    
    if (deptLower.includes('science')) {
      return SCIENCE_SUBJECTS.coreSubjects
    } else if (deptLower.includes('art')) {
      return ARTS_SUBJECTS.coreSubjects
    } else if (deptLower.includes('commercial')) {
      return COMMERCIAL_SUBJECTS.coreSubjects
    }
  }
  
  return []
}

// Get department config
export function getDepartmentConfig(department: string): DepartmentSubjects | null {
  const deptLower = department?.toLowerCase() || ''
  
  if (deptLower.includes('science')) return SCIENCE_SUBJECTS
  if (deptLower.includes('art')) return ARTS_SUBJECTS
  if (deptLower.includes('commercial')) return COMMERCIAL_SUBJECTS
  
  return null
}

// Get total subject count for a student
export function getSubjectCount(studentClass: string, department?: string): number {
  if (studentClass?.startsWith('JSS')) {
    return 17 // JSS = 17 subjects
  }
  
  if (studentClass?.startsWith('SS')) {
    return 10 // SSS = 10 subjects (core + electives)
  }
  
  return 17 // Default
}

// Get subject display names mapping
export const SUBJECT_DISPLAY_NAMES: Record<string, string> = {
  'English Studies': 'English Studies',
  'English Language': 'English Language',
  'Mathematics': 'Mathematics',
  'Basic Science': 'Basic Science',
  'Basic Technology': 'Basic Technology',
  'Physical and Health Education': 'PHE',
  'Information Technology': 'Info Tech',
  'Cultural and Creative Arts': 'CCA',
  'Music': 'Music',
  'Home Economics': 'Home Economics',
  'Agricultural Science': 'Agric Science',
  'Yoruba': 'Yoruba',
  'French': 'French',
  'Civic Education': 'Civic Education',
  'Social Studies': 'Social Studies',
  'Security Education': 'Security Edu',
  'Christian Religious Studies': 'CRS',
  'Islamic Religious Studies': 'IRS',
  'Business Studies': 'Business Studies',
  'Physics': 'Physics',
  'Chemistry': 'Chemistry',
  'Biology': 'Biology',
  'Literature in English': 'Literature',
  'Government': 'Government',
  'Economics': 'Economics',
  'Commerce': 'Commerce',
  'Financial Accounting': 'Accounting',
  'Data Processing': 'Data Processing',
  'Further Mathematics': 'Further Maths',
  'Geography': 'Geography',
  'Computer Science': 'Computer Sci',
  'Technical Drawing': 'Tech Drawing',
  'History': 'History',
  'Igbo': 'Igbo',
  'Hausa': 'Hausa',
  'Marketing': 'Marketing',
  'Office Practice': 'Office Practice',
  'Fine Arts': 'Fine Arts'
}

// Subject configuration with icons and colors
export const SUBJECT_CONFIG: Record<string, { icon: string; color: string; bgColor: string }> = {
  'English Studies': { icon: 'BookOpen', color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  'English Language': { icon: 'BookOpen', color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  'Mathematics': { icon: 'Hash', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  'Basic Science': { icon: 'Zap', color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  'Basic Technology': { icon: 'MonitorPlay', color: 'text-slate-600', bgColor: 'bg-slate-50' },
  'Physical and Health Education': { icon: 'Target', color: 'text-green-600', bgColor: 'bg-green-50' },
  'Information Technology': { icon: 'Laptop', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  'Cultural and Creative Arts': { icon: 'PenTool', color: 'text-pink-600', bgColor: 'bg-pink-50' },
  'Music': { icon: 'Music', color: 'text-purple-600', bgColor: 'bg-purple-50' },
  'Home Economics': { icon: 'Award', color: 'text-rose-600', bgColor: 'bg-rose-50' },
  'Agricultural Science': { icon: 'Target', color: 'text-green-600', bgColor: 'bg-green-50' },
  'Yoruba': { icon: 'BookOpen', color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  'French': { icon: 'BookOpen', color: 'text-sky-600', bgColor: 'bg-sky-50' },
  'Civic Education': { icon: 'Shield', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  'Social Studies': { icon: 'BookOpen', color: 'text-amber-600', bgColor: 'bg-amber-50' },
  'Security Education': { icon: 'Shield', color: 'text-red-600', bgColor: 'bg-red-50' },
  'Christian Religious Studies': { icon: 'BookOpen', color: 'text-sky-600', bgColor: 'bg-sky-50' },
  'Islamic Religious Studies': { icon: 'BookOpen', color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  'Business Studies': { icon: 'BarChart3', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  'Physics': { icon: 'Zap', color: 'text-purple-600', bgColor: 'bg-purple-50' },
  'Chemistry': { icon: 'Sparkles', color: 'text-orange-600', bgColor: 'bg-orange-50' },
  'Biology': { icon: 'Target', color: 'text-green-600', bgColor: 'bg-green-50' },
  'Literature in English': { icon: 'PenTool', color: 'text-pink-600', bgColor: 'bg-pink-50' },
  'Government': { icon: 'Shield', color: 'text-red-600', bgColor: 'bg-red-50' },
  'Economics': { icon: 'TrendingUp', color: 'text-amber-600', bgColor: 'bg-amber-50' },
  'Commerce': { icon: 'BarChart3', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  'Financial Accounting': { icon: 'FileText', color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  'Data Processing': { icon: 'Database', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  'Further Mathematics': { icon: 'Hash', color: 'text-violet-600', bgColor: 'bg-violet-50' },
  'Geography': { icon: 'Target', color: 'text-teal-600', bgColor: 'bg-teal-50' },
  'Computer Science': { icon: 'MonitorPlay', color: 'text-slate-600', bgColor: 'bg-slate-50' },
  'Technical Drawing': { icon: 'PenTool', color: 'text-gray-600', bgColor: 'bg-gray-50' },
  'History': { icon: 'BookOpen', color: 'text-amber-600', bgColor: 'bg-amber-50' },
  'Igbo': { icon: 'BookOpen', color: 'text-green-600', bgColor: 'bg-green-50' },
  'Hausa': { icon: 'BookOpen', color: 'text-amber-600', bgColor: 'bg-amber-50' },
  'Marketing': { icon: 'TrendingUp', color: 'text-orange-600', bgColor: 'bg-orange-50' },
  'Office Practice': { icon: 'FileText', color: 'text-gray-600', bgColor: 'bg-gray-50' },
  'Fine Arts': { icon: 'PenTool', color: 'text-rose-600', bgColor: 'bg-rose-50' }
}