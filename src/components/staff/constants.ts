// src/components/staff/constants.ts - UPDATED VERSION

// ✅ Updated: Department-specific class options for Senior Secondary
export const CLASSES = [
  'JSS 1', 'JSS 2', 'JSS 3',
  'SS1', 'SS2', 'SS3',
  'SS1 Science', 'SS2 Science', 'SS3 Science',
  'SS1 Arts', 'SS2 Arts', 'SS3 Arts',
  'SS1 Commercial', 'SS2 Commercial', 'SS3 Commercial'
]

// For backward compatibility - basic classes
export const BASIC_CLASSES = ['JSS 1', 'JSS 2', 'JSS 3', 'SS1', 'SS2', 'SS3']

// Senior Secondary class options grouped by department
export const SENIOR_CLASS_OPTIONS = {
  general: [
    { value: 'SS1', label: 'SS1 (All Students)', description: 'All SS1 students - Science, Arts, Commercial' },
    { value: 'SS2', label: 'SS2 (All Students)', description: 'All SS2 students - Science, Arts, Commercial' },
    { value: 'SS3', label: 'SS3 (All Students)', description: 'All SS3 students - Science, Arts, Commercial' }
  ],
  science: [
    { value: 'SS1 Science', label: 'SS1 Science', description: 'Science department only' },
    { value: 'SS2 Science', label: 'SS2 Science', description: 'Science department only' },
    { value: 'SS3 Science', label: 'SS3 Science', description: 'Science department only' }
  ],
  arts: [
    { value: 'SS1 Arts', label: 'SS1 Arts', description: 'Arts department only' },
    { value: 'SS2 Arts', label: 'SS2 Arts', description: 'Arts department only' },
    { value: 'SS3 Arts', label: 'SS3 Arts', description: 'Arts department only' }
  ],
  commercial: [
    { value: 'SS1 Commercial', label: 'SS1 Commercial', description: 'Commercial department only' },
    { value: 'SS2 Commercial', label: 'SS2 Commercial', description: 'Commercial department only' },
    { value: 'SS3 Commercial', label: 'SS3 Commercial', description: 'Commercial department only' }
  ]
}

// Junior Secondary options
export const JSS_OPTIONS = [
  { value: 'JSS 1', label: 'JSS 1', description: 'Junior Secondary 1' },
  { value: 'JSS 2', label: 'JSS 2', description: 'Junior Secondary 2' },
  { value: 'JSS 3', label: 'JSS 3', description: 'Junior Secondary 3' }
]

export const CURRENT_TERM = 'third'
export const CURRENT_SESSION = '2025/2026'

export const TERM_NAMES: Record<string, string> = {
  first: 'First Term',
  second: 'Second Term',
  third: 'Third Term'
}

export const AVAILABLE_SESSIONS = ['2025/2026', '2026/2027', '2027/2028']

// ✅ FIXED: Changed Computer Studies to Information Technology
export const JSS_SUBJECTS = [
  'Mathematics', 'English Studies', 'Basic Science', 'Basic Technology',
  'Social Studies', 'Civic Education', 'Christian Religious Studies',
  'Islamic Religious Studies', 'Business Studies', 'Home Economics',
  'Agricultural Science', 'Physical and Health Education',
  'Information Technology', 'Cultural and Creative Arts', 'French'
]

// ✅ UPDATED: Added more SS subjects including Information Technology
export const SS_SUBJECTS = [
  'Mathematics', 'English Language', 'Physics', 'Chemistry', 'Biology',
  'Economics', 'Government', 'Literature in English', 'Geography',
  'Commerce', 'Financial Accounting', 'Agricultural Science',
  'Information Technology', 'Data Processing', 'Further Mathematics',
  'Civic Education', 'Christian Religious Studies'
]

// Helper function to extract year from class name
export const extractYear = (className: string): string => {
  if (!className) return ''
  
  const normalized = className.trim().toUpperCase().replace(/\s/g, '')
  
  // JSS Classes
  if (normalized === 'JSS1') return 'JSS1'
  if (normalized === 'JSS2') return 'JSS2'
  if (normalized === 'JSS3') return 'JSS3'
  
  // SS Classes
  if (normalized === 'SS1') return 'SS1'
  if (normalized === 'SS2') return 'SS2'
  if (normalized === 'SS3') return 'SS3'
  
  // Handle subject-specific SS classes
  if (normalized.startsWith('SS1') && !normalized.startsWith('JSS')) return 'SS1'
  if (normalized.startsWith('SS2') && !normalized.startsWith('JSS')) return 'SS2'
  if (normalized.startsWith('SS3') && !normalized.startsWith('JSS')) return 'SS3'
  
  return className
}

// Helper to get subjects based on class
export const getSubjectsForClass = (className: string): string[] => {
  if (!className) return SS_SUBJECTS
  if (className.startsWith('JSS')) return JSS_SUBJECTS
  return SS_SUBJECTS
}

// Helper to check if class is JSS
export const isJSSClass = (className: string): boolean => {
  return className?.startsWith('JSS') || false
}

// Helper to check if class is SS
export const isSSClass = (className: string): boolean => {
  return className?.startsWith('SS') || false
}

export const TAB_SWITCH_LIMIT = 3
export const FULLSCREEN_EXIT_LIMIT = 3