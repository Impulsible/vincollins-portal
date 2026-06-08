'use client'
import React from 'react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Printer,
  RefreshCw,
  Loader2,
  Sparkles,
} from 'lucide-react'

// ============================================
// WAEC/NECO STANDARD SUBJECT ORDERING
// ============================================
const SUBJECT_ORDER: Record<string, number> = {
  'English Language': 1, 'English Studies': 1, 'Mathematics': 2,
  'Physics': 3, 'Chemistry': 4, 'Further Mathematics': 5, 'Basic Science': 6,
  'Biology': 7, 'Agricultural Science': 8, 'Basic Technology': 9,
  'Economics': 10, 'Geography': 11, 'Social Studies': 12, 'Civic Education': 13,
  'Government': 14, 'History': 15, 'Commerce': 16, 'Financial Accounting': 17,
  'Business Studies': 18, 'Literature in English': 19, 'CRS': 20, 'CCA': 21,
  'Creative Arts': 21, 'Music': 22, 'Yoruba': 23, 'French': 23,
  'Data Processing': 24, 'Information Technology': 25, 'Home Economics': 26,
  'PHE': 27, 'Physical Education': 27, 'Security Education': 28
}

const sortSubjectsByOrder = (subjects: any[]) => {
  return [...subjects].sort((a, b) => {
    const orderA = SUBJECT_ORDER[a.subject] || 999
    const orderB = SUBJECT_ORDER[b.subject] || 999
    return orderA - orderB
  })
}

// ============================================
// WAEC GRADING SYSTEM
// ============================================
const getWAECGrade = (score: number): string => {
  if (score >= 75) return 'A1'
  if (score >= 70) return 'B2'
  if (score >= 65) return 'B3'
  if (score >= 60) return 'C4'
  if (score >= 55) return 'C5'
  if (score >= 50) return 'C6'
  if (score >= 45) return 'D7'
  if (score >= 40) return 'E8'
  return 'F9'
}

const getOverallGrade = (score: number): string => {
  if (score >= 80) return 'A'
  if (score >= 70) return 'B'
  if (score >= 60) return 'C'
  if (score >= 50) return 'P'
  return 'F'
}

const getGradeRemark = (grade: string): string => {
  const remarks: Record<string, string> = {
    'A1': 'Excellent',
    'B2': 'Very Good',
    'B3': 'Good',
    'C4': 'Credit',
    'C5': 'Credit',
    'C6': 'Credit',
    'D7': 'Pass',
    'E8': 'Pass',
    'F9': 'Fail',
  }
  return remarks[grade] || ''
}

const getGradeStyle = (grade: string): string => {
  switch (grade) {
    case 'A1': return 'bg-emerald-600 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block'
    case 'B2':
    case 'B3': return 'bg-blue-600 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block'
    case 'C4':
    case 'C5':
    case 'C6': return 'bg-cyan-600 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block'
    case 'D7':
    case 'E8': return 'bg-amber-600 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block'
    case 'F9': return 'bg-red-600 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block'
    default: return 'bg-gray-500 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block'
  }
}

const getOverallGradeColor = (grade: string): string => {
  switch (grade) {
    case 'A': return 'text-emerald-700 font-bold'
    case 'B': return 'text-blue-700 font-bold'
    case 'C': return 'text-cyan-700 font-bold'
    case 'P': return 'text-amber-700 font-bold'
    case 'F': return 'text-red-700 font-bold'
    default: return 'text-gray-700'
  }
}

// ============================================
// TYPES
// ============================================
interface SubjectScore {
  subject: string
  ca: number
  exam_obj: number
  exam_theory: number
  total: number
  grade: string
  remark: string
}

interface SchoolSettings {
  name: string
  address: string
  phone: string
  email: string
  logo_url?: string
  motto?: string
}

const Panel = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="border border-gray-300 mb-2">
    <div className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 uppercase">{title}</div>
    <div className="p-2 text-[10px]">{children}</div>
  </div>
)

const DEFAULT_SCHOOL_SETTINGS: SchoolSettings = {
  name: 'VINCOLLINS COLLEGE',
  address: '7/9 Lawani Street, off Ishaga Rd, Surulere, Lagos',
  phone: '+234 912 1155 554',
  email: 'vincollinscollege@gmail.com',
  motto: 'Geared Towards Excellence',
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function ViewReportCardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const studentId = searchParams.get('student')
  const term = searchParams.get('term') || 'third'
  const year = searchParams.get('year') || '2025/2026'

  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(DEFAULT_SCHOOL_SETTINGS)
  const [student, setStudent] = useState<any>(null)
  const [subjects, setSubjects] = useState<SubjectScore[]>([])
  const [totalScore, setTotalScore] = useState(0)
  const [averageScore, setAverageScore] = useState(0)
  const [overallGrade, setOverallGrade] = useState('')
  const [nextTermDate, setNextTermDate] = useState<string>('')
  const [teacherComment, setTeacherComment] = useState('')
  const [principalComment, setPrincipalComment] = useState('')

  const loadNextTermDate = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'next_term_date')
        .maybeSingle()

      if (data?.value) {
        setNextTermDate(data.value)
      }
    } catch (error) {
      console.error('Error loading next term date:', error)
    }
  }, [])

  // Call API to generate comments
  const generateCommentsFromAPI = useCallback(async (firstName: string, avgScore: number, subjectsList: any[], className: string, gender: string) => {
    try {
      const response = await fetch('/api/generate-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: firstName,
          averageScore: avgScore,
          subjects: subjectsList.map(s => ({ name: s.subject, score: s.total })),
          className: className,
          gender: gender
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setTeacherComment(data.teacher_comment)
        setPrincipalComment(data.principal_comment)
        return true
      }
      return false
    } catch (error) {
      console.error('API error:', error)
      return false
    }
  }, [])

  // Load scores directly from ca_scores table
  const loadScores = useCallback(async () => {
    if (!studentId) {
      toast.error('No student selected')
      router.back()
      return
    }

    setLoading(true)

    try {
      // Get student profile
      const { data: studentData, error: studentError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', studentId)
        .single()

      if (studentError) throw studentError
      setStudent(studentData)

      // Get all scores for this student from ca_scores
      const { data: scoresData, error: scoresError } = await supabase
        .from('ca_scores')
        .select('*')
        .eq('student_id', studentId)
        .eq('term', term)
        .eq('academic_year', year)
        .eq('status', 'approved')

      if (scoresError) throw scoresError

      // Process scores into subjects
      let processedSubjects: SubjectScore[] = (scoresData || []).map((score: any) => {
        const combinedCA = (score.ca1_score || 0) + (score.ca2_score || 0)
        const examTotal = (score.exam_objective_score || 0) + (score.exam_theory_score || 0)
        const total = combinedCA + examTotal
        const percentage = total > 0 ? Math.round((total / 100) * 100) : 0
        const grade = getWAECGrade(percentage)
        const remark = getGradeRemark(grade)

        return {
          subject: score.subject,
          ca: combinedCA,
          exam_obj: score.exam_objective_score || 0,
          exam_theory: score.exam_theory_score || 0,
          total: total,
          grade: grade,
          remark: remark,
        }
      })

      // Sort subjects by WAEC/NECO standard order
      processedSubjects = sortSubjectsByOrder(processedSubjects)
      
      setSubjects(processedSubjects)

      // Calculate totals
      const total = processedSubjects.reduce((sum, s) => sum + s.total, 0)
      const avg = processedSubjects.length > 0 ? total / processedSubjects.length : 0
      
      setTotalScore(total)
      setAverageScore(avg)
      setOverallGrade(getOverallGrade(avg))

      // Get proper first name
      let firstName = studentData?.first_name || ''
      
      if (!firstName) {
        const nameToSplit = studentData?.display_name || studentData?.full_name || 'Student'
        firstName = nameToSplit.split(' ')[0]
      }
      
      if (firstName) {
        firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()
      } else {
        firstName = 'Student'
      }
      
      const gender = studentData?.gender || 'male'
      const className = studentData?.class || '—'
      
      // Generate comments via API
      await generateCommentsFromAPI(firstName, avg, processedSubjects, className, gender)

    } catch (error) {
      console.error(error)
      toast.error('Failed to load scores')
    } finally {
      setLoading(false)
    }
  }, [studentId, term, year, generateCommentsFromAPI, router])

  // Regenerate comments via API
  const handleRegenerateComments = useCallback(async () => {
    if (!student) return
    
    setRegenerating(true)
    try {
      let firstName = student?.first_name || ''
      
      if (!firstName) {
        const nameToSplit = student?.display_name || student?.full_name || 'Student'
        firstName = nameToSplit.split(' ')[0]
      }
      
      if (firstName) {
        firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()
      } else {
        firstName = 'Student'
      }
      
      const gender = student?.gender || 'male'
      const className = student?.class || '—'
      
      const subjectsForAPI = subjects.map(s => ({ name: s.subject, score: s.total }))
      
      const success = await generateCommentsFromAPI(firstName, averageScore, subjectsForAPI, className, gender)
      
      if (success) {
        toast.success('Comments regenerated successfully!')
      } else {
        toast.error('Failed to regenerate comments')
      }
    } catch (error) {
      console.error(error)
      toast.error('Failed to regenerate comments')
    } finally {
      setRegenerating(false)
    }
  }, [student, subjects, averageScore, generateCommentsFromAPI])

  const generateRatings = () => {
    const getRating = (base: number): number => {
      if (averageScore >= 90) return Math.min(5, base + 1)
      if (averageScore >= 80) return base
      if (averageScore >= 70) return Math.max(3, base)
      if (averageScore >= 60) return Math.max(2, base - 1)
      return Math.max(1, base - 2)
    }

    return {
      behaviorRatings: [
        { name: 'Honesty', rating: getRating(4) },
        { name: 'Neatness', rating: getRating(4) },
        { name: 'Obedience', rating: getRating(4) },
        { name: 'Orderliness', rating: getRating(3) },
        { name: 'Diligence', rating: getRating(4) },
        { name: 'Punctuality', rating: getRating(4) },
        { name: 'Leadership', rating: getRating(3) },
        { name: 'Politeness', rating: getRating(4) },
      ],
      skillRatings: [
        { name: 'Handwriting', rating: getRating(4) },
        { name: 'Verbal Fluency', rating: getRating(4) },
        { name: 'Sports', rating: getRating(3) },
        { name: 'Handling Tools', rating: getRating(3) },
        { name: 'Club Activities', rating: getRating(4) },
      ]
    }
  }

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push('/portal')
        return
      }

      const { data: schoolData } = await supabase
        .from('school_settings')
        .select('*')
        .maybeSingle()

      if (schoolData) {
        setSchoolSettings({
          name: schoolData.school_name || DEFAULT_SCHOOL_SETTINGS.name,
          address: schoolData.school_address || DEFAULT_SCHOOL_SETTINGS.address,
          phone: schoolData.school_phone || DEFAULT_SCHOOL_SETTINGS.phone,
          email: schoolData.school_email || DEFAULT_SCHOOL_SETTINGS.email,
          logo_url: schoolData.logo_path,
          motto: schoolData.school_motto || DEFAULT_SCHOOL_SETTINGS.motto,
        })
      }

      await loadNextTermDate()
      
      if (studentId) {
        await loadScores()
      } else {
        toast.error('No student selected')
        router.back()
      }
    }

    init()
  }, [studentId, term, year, router, loadNextTermDate, loadScores])

  // Handle back button
  const handleBack = () => {
    router.back()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-red-600">Student not found</p>
        <Button onClick={handleBack}>Go Back to Broadsheet</Button>
      </div>
    )
  }

  const termLabels: Record<string, string> = {
    first: 'First Term',
    second: 'Second Term',
    third: 'Third Term',
  }
  const termDisplay = termLabels[term] || term
  const fullName = student.display_name || student.full_name || 'Student'
  const behaviorSkillRatings = generateRatings()
  const formattedNextTermDate = nextTermDate 
    ? new Date(nextTermDate).toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : 'To be announced'

  // Find best and worst subjects
  const bestSubject = subjects.length > 0 
    ? subjects.reduce((a, b) => a.total > b.total ? a : b) 
    : null
  
  const worstSubject = subjects.length > 0 
    ? subjects.reduce((a, b) => a.total < b.total ? a : b) 
    : null
  
  const showAreaForImprovement = worstSubject && worstSubject.total < 50
  const formattedAvg = averageScore.toFixed(2)

  return (
    <div className="bg-gray-100 min-h-screen py-4">
      {/* TOPBAR - Hidden in print */}
      <div className="no-print max-w-full lg:max-w-[210mm] mx-auto mb-4 px-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Broadsheet
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadScores}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRegenerateComments}
              disabled={regenerating}
            >
              {regenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              <span className="hidden sm:inline">Regenerate Comments</span>
              <span className="sm:hidden">Comments</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" /> Print
            </Button>
          </div>
        </div>
      </div>

      {/* REPORT CARD */}
      <div className="bg-white w-full max-w-[210mm] mx-auto text-black border border-gray-300 print:border-none print:max-w-full print:mx-0">
        <div className="p-4 print:p-4">
          {/* HEADER */}
          <div className="border-b border-gray-300 pb-4 print:pb-2">
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-3">
              <div className="w-16 print:w-12 hidden sm:block">
                {schoolSettings.logo_url && (
                  <img src={schoolSettings.logo_url} alt="logo" className="w-14 h-14 object-contain print:w-10 print:h-10" />
                )}
              </div>
              <div className="flex-1 text-center">
                <h1 className="text-[18px] font-bold uppercase text-blue-900 print:text-[14px]">
                  {schoolSettings.name}
                </h1>
                <p className="text-[10px] print:text-[8px]">{schoolSettings.address}</p>
                <p className="text-[10px] print:text-[8px]">Tel: {schoolSettings.phone} | Email: {schoolSettings.email}</p>
                <p className="text-[9px] italic text-amber-600 mt-1 print:text-[7px]">"{schoolSettings.motto}"</p>
                <h2 className="font-bold mt-2 text-[14px] print:text-[11px]">
                  {termDisplay} Student's Performance Report
                </h2>
                <p className="text-[10px] mt-1 font-semibold print:text-[8px]">Academic Session: {year}</p>
              </div>
              <div className="w-16 h-20 sm:w-20 sm:h-24 border border-gray-300 rounded overflow-hidden print:w-16 print:h-20">
                {student.photo_url ? (
                  <img src={student.photo_url} alt="student" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-[8px] sm:text-xs">Photo</div>
                )}
              </div>
            </div>
          </div>

          {/* STUDENT INFO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-[11px] mt-3 mb-4 print:mt-2 print:mb-3 print:text-[9px]">
            <div className="flex flex-wrap"><span className="font-bold w-28 sm:w-32">Name:</span><span className="break-words">{fullName}</span></div>
            <div className="flex flex-wrap"><span className="font-bold w-28 sm:w-32">Admission No:</span><span>{student.admission_number || '—'}</span></div>
            <div className="flex flex-wrap"><span className="font-bold w-28 sm:w-32">Class:</span><span>{student.class || '—'}</span></div>
            <div className="flex flex-wrap"><span className="font-bold w-28 sm:w-32">Term:</span><span>{termDisplay}</span></div>
            <div className="flex flex-wrap"><span className="font-bold w-28 sm:w-32">Session:</span><span>{year}</span></div>
            <div className="flex flex-wrap"><span className="font-bold w-28 sm:w-32">Next Term:</span><span className="break-words">{formattedNextTermDate}</span></div>
          </div>

          {/* MAIN CONTENT - KEEP HORIZONTAL LAYOUT IN PRINT */}
          <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-4 print:grid-cols-[70%_30%]">
            {/* LEFT COLUMN */}
            <div className="min-w-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px] border-collapse border border-gray-300 text-[10px] print:text-[8px]">
                  <thead className="bg-blue-600 text-white">
                    <tr>
                      <th className="border border-blue-500 px-2 py-1.5 text-left">Subjects</th>
                      <th className="border border-blue-500 px-2 py-1.5 text-center w-12">CA</th>
                      <th className="border border-blue-500 px-2 py-1.5 text-center w-12">Exam</th>
                      <th className="border border-blue-500 px-2 py-1.5 text-center w-12">Total</th>
                      <th className="border border-blue-500 px-2 py-1.5 text-center w-10">Grade</th>
                      <th className="border border-blue-500 px-2 py-1.5 text-left">Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-4 text-gray-500">No scores available</td></tr>
                    ) : (
                      subjects.map((subject) => (
                        <tr key={subject.subject} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-2 py-1.5 break-words">{subject.subject}</td>
                          <td className="border border-gray-300 text-center">{subject.ca}</td>
                          <td className="border border-gray-300 text-center">{subject.exam_obj + subject.exam_theory}</td>
                          <td className="border border-gray-300 text-center font-bold">{subject.total}</td>
                          <td className="border border-gray-300 text-center"><span className={getGradeStyle(subject.grade)}>{subject.grade}</span></td>
                          <td className="border border-gray-300 px-2 py-1.5">{subject.remark}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="bg-gray-100 font-bold">
                    <tr>
                      <td colSpan={3} className="border border-gray-300 px-2 py-1.5 text-right">TOTAL / AVERAGE:</td>
                      <td className="border border-gray-300 text-center">{totalScore}</td>
                      <td className="border border-gray-300 text-center"><span className={getOverallGradeColor(overallGrade)}>{overallGrade}</span></td>
                      <td className="border border-gray-300 text-center">{formattedAvg}%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* REMARKS */}
              <div className="mt-4 space-y-2">
                <div className="border-l-4 border-purple-500 bg-purple-50 p-2 text-[10px]">
                  <div className="font-bold text-purple-700 mb-1 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> CLASS TEACHER'S REMARK
                  </div>
                  <p className="italic break-words">{teacherComment || 'Generating comment...'}</p>
                </div>
                <div className="border-l-4 border-blue-500 bg-blue-50 p-2 text-[10px]">
                  <div className="font-bold text-blue-700 mb-1">PRINCIPAL'S REMARK</div>
                  <p className="italic break-words">{principalComment || 'Generating comment...'}</p>
                </div>
              </div>

              {/* GRADE SCALE */}
              <div className="mt-3">
                <div className="bg-blue-600 text-white text-[10px] px-2 py-1 font-bold rounded-t">Grade Scale</div>
                <div className="border border-gray-300 p-2 rounded-b">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-[9px]">
                    <div><span className={getGradeStyle('A1')}>A1</span> 75-100</div>
                    <div><span className={getGradeStyle('B2')}>B2</span> 70-74</div>
                    <div><span className={getGradeStyle('B3')}>B3</span> 65-69</div>
                    <div><span className={getGradeStyle('C4')}>C4</span> 60-64</div>
                    <div><span className={getGradeStyle('C5')}>C5</span> 55-59</div>
                    <div><span className={getGradeStyle('C6')}>C6</span> 50-54</div>
                    <div><span className={getGradeStyle('D7')}>D7</span> 45-49</div>
                    <div><span className={getGradeStyle('E8')}>E8</span> 40-44</div>
                    <div><span className={getGradeStyle('F9')}>F9</span> 0-39</div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-3">
              <div className="border border-gray-300">
                <div className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 uppercase">Performance Summary</div>
                <div className="p-2 text-[10px] space-y-1">
                  <div className="flex justify-between flex-wrap"><span>Total Score:</span><span className="font-bold">{totalScore}</span></div>
                  <div className="flex justify-between flex-wrap"><span>Average:</span><span className="font-bold">{formattedAvg}%</span></div>
                  <div className="flex justify-between flex-wrap"><span>Grade:</span><span className={getOverallGradeColor(overallGrade)}>{overallGrade}</span></div>
                  <div className="flex justify-between flex-wrap"><span>Subjects:</span><span className="font-bold">{subjects.length}</span></div>
                  {bestSubject && (
                    <div className="flex justify-between text-emerald-600 pt-1 border-t flex-wrap">
                      <span>Best:</span><span className="font-bold text-right break-words max-w-[140px]">{bestSubject.subject} ({bestSubject.total})</span>
                    </div>
                  )}
                  {showAreaForImprovement && (
                    <div className="flex justify-between text-red-600 flex-wrap">
                      <span>Improve:</span><span className="font-bold text-right break-words max-w-[140px]">{worstSubject.subject}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border border-gray-300">
                <div className="bg-blue-600 text-white text-[9px] font-bold px-2 py-1 uppercase">Affective Domain</div>
                <div className="p-2 text-[9px] space-y-0.5">
                  {behaviorSkillRatings.behaviorRatings.map((item) => (
                    <div key={item.name} className="flex justify-between items-center">
                      <span className="text-[8px] sm:text-[9px]">{item.name}</span>
                      <span className="font-bold text-blue-600 text-[9px] sm:text-[10px]">{item.rating}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-gray-300">
                <div className="bg-blue-600 text-white text-[9px] font-bold px-2 py-1 uppercase">Psychomotor Skills</div>
                <div className="p-2 text-[9px] space-y-0.5">
                  {behaviorSkillRatings.skillRatings.map((item) => (
                    <div key={item.name} className="flex justify-between items-center">
                      <span className="text-[8px] sm:text-[9px]">{item.name}</span>
                      <span className="font-bold text-green-600 text-[9px] sm:text-[10px]">{item.rating}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-gray-300">
                <div className="bg-blue-600 text-white text-[9px] font-bold px-2 py-1 uppercase">Rating Key</div>
                <div className="p-2 text-[7px] sm:text-[8px] space-y-0.5">
                  <div>5 - Excellent</div>
                  <div>4 - Very Good</div>
                  <div>3 - Good</div>
                  <div>2 - Fair</div>
                  <div>1 - Poor</div>
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="border-t border-gray-300 mt-4 pt-2 text-center text-[9px] text-gray-500 print:mt-2 print:pt-1 print:text-[7px]">
            Powered by Vincollins Portal | {schoolSettings.motto}
          </div>
        </div>
      </div>

       {/* Print CSS */}
      <style jsx global>{`
        @media print {
          body {
            background: white;
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
          .bg-blue-600, .bg-purple-600, .bg-emerald-600, .bg-cyan-600, .bg-amber-600, .bg-red-600, 
          .bg-blue-50, .bg-purple-50, .bg-gray-100 {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
    </div>
  )
}