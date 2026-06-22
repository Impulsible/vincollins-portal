'use client'
import React from 'react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useReactToPrint } from 'react-to-print'
import {
  ArrowLeft,
  Printer,
  RefreshCw,
  Loader2,
  Sparkles,
  Download,
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
    case 'A1': return 'bg-emerald-600 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block print:text-[9px]'
    case 'B2':
    case 'B3': return 'bg-blue-600 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block print:text-[9px]'
    case 'C4':
    case 'C5':
    case 'C6': return 'bg-cyan-600 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block print:text-[9px]'
    case 'D7':
    case 'E8': return 'bg-amber-600 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block print:text-[9px]'
    case 'F9': return 'bg-red-600 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block print:text-[9px]'
    default: return 'bg-gray-500 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block print:text-[9px]'
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
  const reportRef = useRef<HTMLDivElement>(null)

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

  const handleDownloadPDF = useReactToPrint({
    contentRef: reportRef,
    documentTitle: `${student?.display_name || student?.full_name || 'Student'}_Report_Card_${term}_${year}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 10mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          color-adjust: exact;
        }
        * {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          color-adjust: exact;
        }
      }
    `,
  })

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

  const loadScores = useCallback(async () => {
    if (!studentId) {
      toast.error('No student selected')
      router.back()
      return
    }

    setLoading(true)

    try {
      const { data: studentData, error: studentError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', studentId)
        .single()

      if (studentError) throw studentError
      setStudent(studentData)

      const { data: scoresData, error: scoresError } = await supabase
        .from('ca_scores')
        .select('*')
        .eq('student_id', studentId)
        .eq('term', term)
        .eq('academic_year', year)
        .eq('status', 'approved')

      if (scoresError) throw scoresError

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

      const subjectMap = new Map<string, SubjectScore>()
      processedSubjects.forEach(s => {
        const existing = subjectMap.get(s.subject)
        if (!existing || s.total > existing.total) {
          subjectMap.set(s.subject, s)
        }
      })
      processedSubjects = Array.from(subjectMap.values())
      processedSubjects = sortSubjectsByOrder(processedSubjects)
      
      setSubjects(processedSubjects)

      const total = processedSubjects.reduce((sum, s) => sum + s.total, 0)
      const avg = processedSubjects.length > 0 ? total / processedSubjects.length : 0
      
      setTotalScore(total)
      setAverageScore(avg)
      setOverallGrade(getOverallGrade(avg))

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
      
      await generateCommentsFromAPI(firstName, avg, processedSubjects, className, gender)

    } catch (error) {
      console.error(error)
      toast.error('Failed to load scores')
    } finally {
      setLoading(false)
    }
  }, [studentId, term, year, generateCommentsFromAPI, router])

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
        toast.success('Comments regenerated!')
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
        day: 'numeric', month: 'long', year: 'numeric'
      })
    : 'To be announced'

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
      {/* TOPBAR */}
      <div className="no-print max-w-full lg:max-w-[210mm] mx-auto mb-4 px-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Broadsheet
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadScores}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleRegenerateComments} disabled={regenerating}>
              {regenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Regen Comments
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" /> Print
            </Button>
            <Button variant="default" size="sm" onClick={() => handleDownloadPDF()} className="bg-blue-600 hover:bg-blue-700">
              <Download className="h-4 w-4 mr-2" /> Download PDF
            </Button>
          </div>
        </div>
      </div>

      {/* REPORT CARD */}
      <div ref={reportRef}>
        <div className="bg-white w-full max-w-[210mm] mx-auto text-black border-2 border-blue-900 print:border-2 print:border-blue-900 print:max-w-full print:mx-0 p-4 print:p-3">
          
          {/* HEADER */}
          <div className="border-b-2 border-blue-900 pb-3 mb-3 print:pb-2 print:mb-2">
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-3">
              <div className="w-16 print:w-14 hidden sm:block">
                {schoolSettings.logo_url && (
                  <img src={schoolSettings.logo_url} alt="logo" className="w-14 h-14 object-contain print:w-12 print:h-12" />
                )}
              </div>
              <div className="flex-1 text-center">
                <h1 className="text-[18px] font-bold uppercase text-blue-900 print:text-[15px] tracking-wide">
                  {schoolSettings.name}
                </h1>
                <p className="text-[10px] print:text-[9px] text-gray-800">{schoolSettings.address}</p>
                <p className="text-[10px] print:text-[9px] text-gray-800">Tel: {schoolSettings.phone} | Email: {schoolSettings.email}</p>
                <p className="text-[9px] italic text-amber-700 mt-1 print:text-[8px] font-medium">"{schoolSettings.motto}"</p>
                <h2 className="font-bold mt-2 text-[14px] print:text-[12px] text-blue-900">
                  {termDisplay} Student's Performance Report
                </h2>
                <p className="text-[10px] mt-1 font-semibold print:text-[9px] text-gray-800">Academic Session: {year}</p>
              </div>
              <div className="w-16 h-20 sm:w-20 sm:h-24 border-2 border-blue-900 rounded overflow-hidden print:w-16 print:h-20">
                {student.photo_url ? (
                  <img src={student.photo_url} alt="student" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-[8px] sm:text-xs">Photo</div>
                )}
              </div>
            </div>
          </div>

          {/* STUDENT INFO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-[11px] mb-4 print:mb-3 print:text-[10px]">
            <div className="flex flex-wrap"><span className="font-bold w-28 sm:w-32 text-gray-800">Name:</span><span className="break-words text-black">{fullName}</span></div>
            <div className="flex flex-wrap"><span className="font-bold w-28 sm:w-32 text-gray-800">Admission No:</span><span className="text-black">{student.admission_number || '—'}</span></div>
            <div className="flex flex-wrap"><span className="font-bold w-28 sm:w-32 text-gray-800">Class:</span><span className="text-black">{student.class || '—'}</span></div>
            <div className="flex flex-wrap"><span className="font-bold w-28 sm:w-32 text-gray-800">Term:</span><span className="text-black">{termDisplay}</span></div>
            <div className="flex flex-wrap"><span className="font-bold w-28 sm:w-32 text-gray-800">Session:</span><span className="text-black">{year}</span></div>
            <div className="flex flex-wrap"><span className="font-bold w-28 sm:w-32 text-gray-800">Next Term:</span><span className="break-words text-black">{formattedNextTermDate}</span></div>
          </div>

          {/* MAIN CONTENT */}
          <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-4 print:grid-cols-[70%_30%] print:gap-3">
            {/* LEFT COLUMN */}
            <div className="min-w-0">
              <div className="print:overflow-visible">
                <table className="w-full border-collapse border-2 border-blue-900 text-[10px] print:text-[9px] print:w-full">
                  <thead className="bg-blue-700 text-white">
                    <tr>
                      <th className="border border-blue-500 px-2 py-2 text-left print:text-[9px] print:py-1.5 print:px-1.5">Subjects</th>
                      <th className="border border-blue-500 px-2 py-2 text-center w-10 print:text-[9px] print:py-1.5 print:px-1">CA</th>
                      <th className="border border-blue-500 px-2 py-2 text-center w-10 print:text-[9px] print:py-1.5 print:px-1">Exam</th>
                      <th className="border border-blue-500 px-2 py-2 text-center w-10 print:text-[9px] print:py-1.5 print:px-1">Total</th>
                      <th className="border border-blue-500 px-2 py-2 text-center w-10 print:text-[9px] print:py-1.5 print:px-1">Grade</th>
                      <th className="border border-blue-500 px-2 py-2 text-left print:text-[9px] print:py-1.5 print:px-1.5">Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-4 text-gray-500">No scores available</td></tr>
                    ) : (
                      subjects.map((subject, index) => (
                        <tr key={`${subject.subject}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border border-gray-400 px-2 py-1.5 break-words print:text-[9px] print:py-1 print:px-1.5 text-black font-medium">{subject.subject}</td>
                          <td className="border border-gray-400 text-center print:text-[9px] print:py-1 print:px-1 text-black">{subject.ca}</td>
                          <td className="border border-gray-400 text-center print:text-[9px] print:py-1 print:px-1 text-black">{subject.exam_obj + subject.exam_theory}</td>
                          <td className="border border-gray-400 text-center font-bold print:text-[9px] print:py-1 print:px-1 text-black">{subject.total}</td>
                          <td className="border border-gray-400 text-center print:py-1"><span className={getGradeStyle(subject.grade)}>{subject.grade}</span></td>
                          <td className="border border-gray-400 px-2 py-1.5 print:text-[9px] print:py-1 print:px-1.5 text-black">{subject.remark}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="bg-blue-50 font-bold">
                    <tr>
                      <td colSpan={3} className="border border-gray-400 px-2 py-2 text-right print:text-[10px] print:py-1.5 text-black">TOTAL / AVERAGE:</td>
                      <td className="border border-gray-400 text-center print:text-[10px] print:py-1.5 text-black">{totalScore}</td>
                      <td className="border border-gray-400 text-center print:py-1.5"><span className={getOverallGradeColor(overallGrade)}>{overallGrade}</span></td>
                      <td className="border border-gray-400 text-center print:text-[10px] print:py-1.5 text-black">{formattedAvg}%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* REMARKS */}
              <div className="mt-4 space-y-2 print:mt-3">
                <div className="border-l-4 border-purple-600 bg-purple-50 p-3 text-[10px] print:text-[9px] print:p-2 rounded-r">
                  <div className="font-bold text-purple-800 mb-1 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> CLASS TEACHER'S REMARK
                  </div>
                  <p className="italic text-gray-800 leading-relaxed">{teacherComment || 'Generating comment...'}</p>
                </div>
                <div className="border-l-4 border-blue-600 bg-blue-50 p-3 text-[10px] print:text-[9px] print:p-2 rounded-r">
                  <div className="font-bold text-blue-800 mb-1">PRINCIPAL'S REMARK</div>
                  <p className="italic text-gray-800 leading-relaxed">{principalComment || 'Generating comment...'}</p>
                </div>
              </div>

              {/* GRADE SCALE */}
              <div className="mt-3 print:mt-2">
                <div className="bg-blue-700 text-white text-[10px] px-3 py-1.5 font-bold rounded-t print:text-[9px]">Grade Scale</div>
                <div className="border-2 border-t-0 border-blue-900 p-2 rounded-b">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[9px] print:text-[8px]">
                    <div className="flex items-center gap-1"><span className={getGradeStyle('A1')}>A1</span> <span className="text-gray-800">75-100</span></div>
                    <div className="flex items-center gap-1"><span className={getGradeStyle('B2')}>B2</span> <span className="text-gray-800">70-74</span></div>
                    <div className="flex items-center gap-1"><span className={getGradeStyle('B3')}>B3</span> <span className="text-gray-800">65-69</span></div>
                    <div className="flex items-center gap-1"><span className={getGradeStyle('C4')}>C4</span> <span className="text-gray-800">60-64</span></div>
                    <div className="flex items-center gap-1"><span className={getGradeStyle('C5')}>C5</span> <span className="text-gray-800">55-59</span></div>
                    <div className="flex items-center gap-1"><span className={getGradeStyle('C6')}>C6</span> <span className="text-gray-800">50-54</span></div>
                    <div className="flex items-center gap-1"><span className={getGradeStyle('D7')}>D7</span> <span className="text-gray-800">45-49</span></div>
                    <div className="flex items-center gap-1"><span className={getGradeStyle('E8')}>E8</span> <span className="text-gray-800">40-44</span></div>
                    <div className="flex items-center gap-1"><span className={getGradeStyle('F9')}>F9</span> <span className="text-gray-800">0-39</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-3 print:space-y-2">
              <div className="border-2 border-blue-900">
                <div className="bg-blue-700 text-white text-[10px] font-bold px-3 py-1.5 uppercase print:text-[9px] print:py-1">Performance Summary</div>
                <div className="p-3 text-[10px] space-y-1.5 print:text-[9px] print:p-2 print:space-y-1">
                  <div className="flex justify-between flex-wrap"><span className="text-gray-800">Total Score:</span><span className="font-bold text-black">{totalScore}</span></div>
                  <div className="flex justify-between flex-wrap"><span className="text-gray-800">Average:</span><span className="font-bold text-black">{formattedAvg}%</span></div>
                  <div className="flex justify-between flex-wrap"><span className="text-gray-800">Grade:</span><span className={getOverallGradeColor(overallGrade)}>{overallGrade}</span></div>
                  <div className="flex justify-between flex-wrap"><span className="text-gray-800">Subjects:</span><span className="font-bold text-black">{subjects.length}</span></div>
                  {bestSubject && (
                    <div className="flex justify-between text-emerald-700 pt-1 border-t border-gray-300 flex-wrap">
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

              <div className="border-2 border-blue-900">
                <div className="bg-blue-700 text-white text-[9px] font-bold px-3 py-1.5 uppercase print:text-[8px] print:py-1">Affective Domain</div>
                <div className="p-2 text-[9px] space-y-1 print:text-[8px] print:space-y-0.5">
                  {behaviorSkillRatings.behaviorRatings.map((item) => (
                    <div key={item.name} className="flex justify-between items-center">
                      <span className="text-gray-800">{item.name}</span>
                      <span className="font-bold text-blue-700">{item.rating}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-2 border-blue-900">
                <div className="bg-blue-700 text-white text-[9px] font-bold px-3 py-1.5 uppercase print:text-[8px] print:py-1">Psychomotor Skills</div>
                <div className="p-2 text-[9px] space-y-1 print:text-[8px] print:space-y-0.5">
                  {behaviorSkillRatings.skillRatings.map((item) => (
                    <div key={item.name} className="flex justify-between items-center">
                      <span className="text-gray-800">{item.name}</span>
                      <span className="font-bold text-green-700">{item.rating}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-2 border-blue-900">
                <div className="bg-blue-700 text-white text-[9px] font-bold px-3 py-1.5 uppercase print:text-[8px] print:py-1">Rating Key</div>
                <div className="p-2 text-[8px] space-y-0.5 print:text-[7px] print:space-y-0">
                  <div className="text-gray-800">5 - Excellent</div>
                  <div className="text-gray-800">4 - Very Good</div>
                  <div className="text-gray-800">3 - Good</div>
                  <div className="text-gray-800">2 - Fair</div>
                  <div className="text-gray-800">1 - Poor</div>
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="border-t-2 border-blue-900 mt-4 pt-2 text-center text-[9px] text-gray-600 print:mt-3 print:pt-2 print:text-[8px]">
            Powered by Vincollins Portal | {schoolSettings.motto}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 8mm;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
            min-width: 0 !important;
            max-width: 100% !important;
            table-layout: auto !important;
          }
          th, td {
            border-color: #000 !important;
            word-break: break-word !important;
          }
          .overflow-x-auto {
            overflow: visible !important;
          }
          [class*="overflow"] {
            overflow: visible !important;
          }
          img {
            max-width: 100% !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  )
}