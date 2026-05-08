// components/admin/students/constants/index.ts

export const CLASSES = ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3'] as const

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
  'SS 1': 'from-emerald-500 to-teal-500',
  'SS 2': 'from-blue-500 to-indigo-500',
  'SS 3': 'from-purple-500 to-pink-500',
}

export const CURRENT_YEAR = new Date().getFullYear()

export const INITIAL_FORM_DATA = {
  first_name: '',
  middle_name: '',
  last_name: '',
  class: '',
  department: '',
  admission_year: CURRENT_YEAR,
  admission_number: '',            // ✅ Manual input - starts empty
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
  'admission_number',              // ✅ Included in CSV
  'gender',
  'date_of_birth',
  'next_term_begins',
  'phone',
  'address',
]

export const CSV_SAMPLE_ROWS = [
  ['John', 'Chukwudi', 'Doe', 'SS 1', 'Science', '2024', '2024VIN45', 'male', '2009-05-15', '2025-09-15', '+2341234567890', 'Lagos, Nigeria'],
  ['Jane', 'Adanna', 'Smith', 'JSS 2', 'Arts', '2025', '2025VIN78', 'female', '2011-03-20', '', '+2349876543210', 'Abuja, Nigeria'],
  ['Michael', '', 'Okonkwo', 'SS 3', 'Commercial', '2023', '2023VIN12', 'male', '2007-11-08', '', '', ''],
]