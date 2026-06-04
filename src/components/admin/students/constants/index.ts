// components/admin/students/constants/index.ts - UPDATED
export const CLASSES = [
  // Junior Secondary
  'JSS 1', 'JSS 2', 'JSS 3',
  
  // Senior Secondary - All Students (General)
  'SS1', 'SS2', 'SS3',
  
  // Senior Secondary - Science Department
  'SS1 Science', 'SS2 Science', 'SS3 Science',
  
  // Senior Secondary - Arts Department
  'SS1 Arts', 'SS2 Arts', 'SS3 Arts',
  
  // Senior Secondary - Commercial Department
  'SS1 Commercial', 'SS2 Commercial', 'SS3 Commercial',
] as const

export const BASE_CLASSES = ['JSS 1', 'JSS 2', 'JSS 3', 'SS1', 'SS2', 'SS3'] as const

export const DEPARTMENTS = ['Science', 'Arts', 'Commercial', 'Technology'] as const

export const GENDERS = [
  { value: 'male' as const, label: 'Male', emoji: '👦' },
  { value: 'female' as const, label: 'Female', emoji: '👧' },
  { value: 'other' as const, label: 'Other', emoji: '👤' },
]

export const CLASS_COLORS: Record<string, string> = {
  'JSS 1': 'from-amber-500 to-orange-500',
  'JSS 2': 'from-rose-500 to-red-500',
  'JSS 3': 'from-cyan-500 to-sky-500',
  'SS1': 'from-emerald-500 to-teal-500',
  'SS1 Science': 'from-blue-500 to-indigo-500',
  'SS1 Arts': 'from-purple-500 to-pink-500',
  'SS1 Commercial': 'from-amber-500 to-orange-500',
  'SS2': 'from-emerald-500 to-teal-500',
  'SS2 Science': 'from-blue-500 to-indigo-500',
  'SS2 Arts': 'from-purple-500 to-pink-500',
  'SS2 Commercial': 'from-amber-500 to-orange-500',
  'SS3': 'from-emerald-500 to-teal-500',
  'SS3 Science': 'from-blue-500 to-indigo-500',
  'SS3 Arts': 'from-purple-500 to-pink-500',
  'SS3 Commercial': 'from-amber-500 to-orange-500',
}

// Helper function to get year group from class name
export const getYearGroup = (className: string): string => {
  if (className.includes('JSS')) return className.split(' ')[0] + ' ' + className.split(' ')[1]
  if (className.includes('SS1')) return 'SS1'
  if (className.includes('SS2')) return 'SS2'
  if (className.includes('SS3')) return 'SS3'
  return className
}

// Helper function to get department from class name
export const getDepartmentFromClass = (className: string): string => {
  if (className.includes('Science')) return 'Science'
  if (className.includes('Arts')) return 'Arts'
  if (className.includes('Commercial')) return 'Commercial'
  if (className.startsWith('JSS')) return 'Junior'
  return 'General'
}

// Helper function to check if class is JSS
export const isJSSClass = (className: string): boolean => {
  return className?.startsWith('JSS') || false
}

// Helper function to check if class is SS
export const isSSClass = (className: string): boolean => {
  return className?.includes('SS') || false
}

// Get all classes for dropdown (simpler version for forms)
export const getFormClassOptions = () => {
  return [
    // JSS
    { value: 'JSS 1', label: 'JSS 1', group: 'Junior Secondary' },
    { value: 'JSS 2', label: 'JSS 2', group: 'Junior Secondary' },
    { value: 'JSS 3', label: 'JSS 3', group: 'Junior Secondary' },
    // All Students
    { value: 'SS1', label: 'SS1 (All Students)', group: 'All Students', description: 'General subjects like Math, English' },
    { value: 'SS2', label: 'SS2 (All Students)', group: 'All Students', description: 'General subjects like Math, English' },
    { value: 'SS3', label: 'SS3 (All Students)', group: 'All Students', description: 'General subjects like Math, English' },
    // Science
    { value: 'SS1 Science', label: 'SS1 Science', group: 'Science', description: 'Physics, Chemistry, Biology' },
    { value: 'SS2 Science', label: 'SS2 Science', group: 'Science', description: 'Physics, Chemistry, Biology' },
    { value: 'SS3 Science', label: 'SS3 Science', group: 'Science', description: 'Physics, Chemistry, Biology' },
    // Arts
    { value: 'SS1 Arts', label: 'SS1 Arts', group: 'Arts', description: 'Literature, Government, CRS' },
    { value: 'SS2 Arts', label: 'SS2 Arts', group: 'Arts', description: 'Literature, Government, CRS' },
    { value: 'SS3 Arts', label: 'SS3 Arts', group: 'Arts', description: 'Literature, Government, CRS' },
    // Commercial
    { value: 'SS1 Commercial', label: 'SS1 Commercial', group: 'Commercial', description: 'Accounting, Commerce, Economics' },
    { value: 'SS2 Commercial', label: 'SS2 Commercial', group: 'Commercial', description: 'Accounting, Commerce, Economics' },
    { value: 'SS3 Commercial', label: 'SS3 Commercial', group: 'Commercial', description: 'Accounting, Commerce, Economics' },
  ]
}

export const CURRENT_YEAR = new Date().getFullYear()

export const INITIAL_FORM_DATA = {
  first_name: '',
  middle_name: '',
  last_name: '',
  class: '',
  department: '',
  admission_year: CURRENT_YEAR,
  admission_number: '',
  phone: '',
  address: '',
  gender: 'male' as const,
  date_of_birth: '',
  next_term_begins: '',
}

export const generateAdmissionYears = (): number[] => {
  const startYear = 2022
  const endYear = CURRENT_YEAR + 10
  return Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i)
}

export const CSV_HEADERS = [
  'first_name',
  'middle_name',
  'last_name',
  'class',
  'department',
  'admission_year',
  'admission_number',
  'gender',
  'date_of_birth',
  'next_term_begins',
  'phone',
  'address',
]

export const CSV_SAMPLE_ROWS = [
  ['John', 'Chukwudi', 'Doe', 'SS1 Science', 'Science', '2024', '2024VIN45', 'male', '2009-05-15', '2025-09-15', '+2341234567890', 'Lagos, Nigeria'],
  ['Jane', 'Adanna', 'Smith', 'JSS 2', 'Arts', '2025', '2025VIN78', 'female', '2011-03-20', '', '+2349876543210', 'Abuja, Nigeria'],
  ['Michael', '', 'Okonkwo', 'SS1 Commercial', 'Commercial', '2023', '2023VIN12', 'male', '2007-11-08', '', '', ''],
]