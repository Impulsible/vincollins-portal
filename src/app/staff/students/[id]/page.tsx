/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// app/staff/students/[id]/page.tsx - STUDENT DETAILS & PERFORMANCE PAGE - FULLY FIXED
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { StaffSidebar } from '@/components/staff/StaffSidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  ArrowLeft, Mail, Calendar, Award, BookOpen,
  TrendingUp, Download, Printer, Loader2, RefreshCw,
  GraduationCap, CheckCircle, XCircle, FileText,
  Activity, Trophy, Star, User,
  Plus, Save, Edit, Eye, Sparkles,
  CheckCheck
} from 'lucide-react'

// Define ReportCardData interface
interface ReportCardData {
  schoolName: string
  schoolLogo?: string
  studentName: string
  studentPhoto?: string
  class: string
  admissionNo: string
  term: string
  academicYear: string
  gender: string
  date: string
  subjects: {
    name: string
    ca1: number
    ca2: number
    examObj: number
    examTheory: number
    total: number
    grade: string
    remark: string
  }[]
  totalScore: number
  averageScore: number
  position: number
  totalStudents: number
  classHighest: number
  classAverage: number
  assessment: {
    handwriting: number
    sports: number
    creativity: number
    technical: number
    punctuality: number
    neatness: number
    politeness: number
    cooperation: number
    leadership: number
    daysPresent: number
    daysAbsent: number
  }
  teacherComment: string
  principalComment: string
  classTeacher: string
  principalName: string
}

interface StudentProfile {
  id: string
  full_name: string
  email: string
  class: string
  department: string
  vin_id: string
  photo_url?: string
  admission_year: number
  phone?: string
  address?: string
  parent_name?: string
  parent_phone?: string
  gender?: string
  date_of_birth?: string
}

interface ExamResult {
  id: string
  exam_id: string
  exam_title: string
  subject: string
  objective_score: number
  objective_total: number
  theory_score: number | null
  theory_total: number
  total_score: number
  percentage: number
  grade: string
  remark: string
  is_passed: boolean
  status: string
  completed_at: string
  term: string
  academic_year: string
  has_theory: boolean
  correct_count?: number
  incorrect_count?: number
  unanswered_count?: number
}

interface CAScore {
  id: string
  subject: string
  term: string
  academic_year: string
  ca1_score: number
  ca2_score: number
  exam_objective_score: number
  exam_theory_score: number
  exam_total_score: number
  total_score: number
  grade: string
  remark: string
  teacher_name?: string
  created_at: string
  updated_at: string
}

interface Assessment {
  id: string
  handwriting: number
  sports_participation: number
  creative_arts: number
  technical_skills: number
  punctuality: number
  neatness: number
  politeness: number
  cooperation: number
  leadership: number
  days_present: number
  days_absent: number
  teacher_comments: string
  principal_comments: string
  ai_generated_comments?: string
}

interface PerformanceStats {
  averageScore: number
  totalExams: number
  passedExams: number
  failedExams: number
  classRank: number
  totalStudents: number
  bestSubject: string
  bestSubjectScore: number
  attendance: number
}

const terms = ['First Term', 'Second Term', 'Third Term']
const academicYears = ['2024/2025', '2025/2026', '2026/2027']
const subjects = [
  'Mathematics', 'English Language', 'Physics', 'Chemistry', 'Biology',
  'Economics', 'Government', 'Literature in English', 'Geography',
  'Commerce', 'Financial Accounting', 'Agricultural Science',
  'Christian Religious Studies', 'Civic Education', 'Computer Studies'
]

// Star Rating Component
const StarRating = ({ value, onChange, readonly = false }: { value: number; onChange?: (val: number) => void; readonly?: boolean }) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={cn(
            "transition-colors",
            readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
          )}
        >
          <Star className={cn(
            "h-5 w-5",
            star <= value ? "fill-amber-500 text-amber-500" : "text-gray-300 dark:text-gray-600"
          )} />
        </button>
      ))}
    </div>
  )
}

// Helper function to format profile for Header component
const formatProfileForHeader = (profile: any) => {
  if (!profile) return undefined
  return {
    id: profile.id,
    name: profile.full_name || profile.email?.split('@')[0] || 'Staff User',
    email: profile.email,
    role: profile.role === 'staff' ? 'teacher' : (profile.role || 'teacher'),
    avatar: profile.photo_url || profile.avatar_url,
    isAuthenticated: true
  }
}

// Simple PDF generator
async function generateSimplePDF(data: ReportCardData): Promise<Blob> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Report Card - ${data.studentName}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #1a355c; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #2980b9; color: white; }
          .header { text-align: center; margin-bottom: 30px; }
          .footer { margin-top: 50px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${data.schoolName}</h1>
          <h2>TERMINAL REPORT CARD</h2>
          <p>${data.term} - ${data.academicYear}</p>
        </div>
        <div style="margin-bottom: 30px;">
          <p><strong>Name:</strong> ${data.studentName}</p>
          <p><strong>Class:</strong> ${data.class}</p>
          <p><strong>Admission No:</strong> ${data.admissionNo}</p>
          <p><strong>Date:</strong> ${data.date}</p>
        </div>
        <h3>ACADEMIC PERFORMANCE</h3>
        <table>
          <thead>
            <tr>
              <th>Subject</th>
              <th>CA1 (20)</th>
              <th>CA2 (20)</th>
              <th>Exam (60)</th>
              <th>Total (100)</th>
              <th>Grade</th>
              <th>Remark</th>
            </tr>
          </thead>
          <tbody>
            ${data.subjects.map(s => `
              <tr>
                <td>${s.name}</td>
                <td>${s.ca1}</td>
                <td>${s.ca2}</td>
                <td>${s.examObj + s.examTheory}</td>
                <td>${s.total}</td>
                <td>${s.grade}</td>
                <td>${s.remark}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="margin: 20px 0;">
          <p><strong>Total Score:</strong> ${data.totalScore}</p>
          <p><strong>Average Score:</strong> ${data.averageScore}%</p>
          <p><strong>Position:</strong> ${data.position} out of ${data.totalStudents}</p>
        </div>
        <h3>ASSESSMENT</h3>
        <p><strong>Teacher's Comment:</strong> ${data.teacherComment}</p>
        <p><strong>Principal's Comment:</strong> ${data.principalComment}</p>
        <div class="footer">
          <p>Class Teacher: ${data.classTeacher}</p>
          <p>Principal: ${data.principalName}</p>
          <p>Date: ${data.date}</p>
        </div>
      </body>
    </html>
  `
  return new Blob([htmlContent], { type: 'text/html' })
}

export default function StudentDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const studentId = params?.id as string
  
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  
  const [student, setStudent] = useState<StudentProfile | null>(null)
  const [examResults, setExamResults] = useState<ExamResult[]>([])
  const [caScores, setCAScores] = useState<CAScore[]>([])
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [stats, setStats] = useState<PerformanceStats>({
    averageScore: 0,
    totalExams: 0,
    passedExams: 0,
    failedExams: 0,
    classRank: 0,
    totalStudents: 0,
    bestSubject: '',
    bestSubjectScore: 0,
    attendance: 94
  })
  
  // Dialog states
  const [showCADialog, setShowCADialog] = useState(false)
  const [showAssessmentDialog, setShowAssessmentDialog] = useState(false)
  const [editingCA, setEditingCA] = useState<CAScore | null>(null)
  const [selectedTerm, setSelectedTerm] = useState(terms[0])
  const [selectedYear, setSelectedYear] = useState(academicYears[0])
  const [generatingReport, setGeneratingReport] = useState(false)
  const [generatingAI, setGeneratingAI] = useState(false)
  const [fetchingExamScore, setFetchingExamScore] = useState(false)
  
  // CA Form state
  const [caForm, setCAForm] = useState({
    subject: '',
    ca1_score: 0,
    ca2_score: 0,
    exam_objective_score: 0,
    exam_theory_score: 0
  })
  
  // Assessment Form state
  const [assessmentForm, setAssessmentForm] = useState<Partial<Assessment>>({
    handwriting: 3,
    sports_participation: 3,
    creative_arts: 3,
    technical_skills: 3,
    punctuality: 3,
    neatness: 3,
    politeness: 3,
    cooperation: 3,
    leadership: 3,
    days_present: 0,
    days_absent: 0,
    teacher_comments: '',
    principal_comments: ''
  })
  
  // Helper functions
  const getInitials = (name?: string): string => {
    if (!name) return 'ST'
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }
  
  const calculateGradeAndRemark = (totalScore: number): { grade: string; remark: string } => {
    if (totalScore >= 75) return { grade: 'A1', remark: 'Excellent' }
    if (totalScore >= 70) return { grade: 'B2', remark: 'Very Good' }
    if (totalScore >= 65) return { grade: 'B3', remark: 'Very Good' }
    if (totalScore >= 60) return { grade: 'C4', remark: 'Good' }
    if (totalScore >= 55) return { grade: 'C5', remark: 'Good' }
    if (totalScore >= 50) return { grade: 'C6', remark: 'Good' }
    if (totalScore >= 45) return { grade: 'D7', remark: 'Pass' }
    if (totalScore >= 40) return { grade: 'E8', remark: 'Pass' }
    return { grade: 'F9', remark: 'Fail' }
  }
  
  const getGradeColor = (grade: string): string => {
    if (!grade) return ''
    if (grade.startsWith('A')) return 'bg-green-100 text-green-700 border-green-200'
    if (grade.startsWith('B')) return 'bg-blue-100 text-blue-700 border-blue-200'
    if (grade.startsWith('C')) return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    if (grade.startsWith('D') || grade.startsWith('E')) return 'bg-orange-100 text-orange-700 border-orange-200'
    if (grade === 'F9') return 'bg-red-100 text-red-700 border-red-200'
    return 'bg-gray-100 text-gray-700'
  }
  
  // Load all data
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      // ✅ FIX 1: Get session and profile with maybeSingle()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        // Use maybeSingle() instead of single() to prevent 406 errors
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()
        
        if (profileError) {
          console.error('Profile fetch error:', profileError)
          // Set fallback profile so teacher name doesn't show as "Teacher"
          setProfile({
            id: session.user.id,
            full_name: session.user.email?.split('@')[0] || 'Staff User',
            email: session.user.email,
            role: 'staff'
          })
        } else if (profileData) {
          setProfile(profileData)
        } else {
          // No profile exists - create fallback
          console.log('No profile found for user, using fallback')
          setProfile({
            id: session.user.id,
            full_name: session.user.email?.split('@')[0] || 'Staff User',
            email: session.user.email,
            role: 'staff'
          })
        }
      }
      
      if (!studentId) {
        toast.error('Student ID not found')
        router.push('/staff')
        return
      }
      
      // ✅ FIX 2: Load student profile with maybeSingle()
      const { data: studentData, error: studentError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', studentId)
        .maybeSingle()
        
      if (studentError) {
        console.error('Student fetch error:', studentError)
        toast.error('Error loading student data')
        setLoading(false)
        return
      }
      
      if (!studentData) {
        console.log('Student not found with ID:', studentId)
        toast.error('Student not found')
        setStudent(null)
        setLoading(false)
        return
      }
      
      // Get VIN ID from users table if not in profiles
      const { data: userData } = await supabase
        .from('users')
        .select('vin_id')
        .eq('id', studentId)
        .maybeSingle()
        
      setStudent({
        ...studentData,
        vin_id: userData?.vin_id || studentData.vin_id || `VIN-${studentId.slice(0, 8)}`
      })
      
      // ✅ FIX 3: Load exam results with proper error handling
      // First load exam_scores
      const { data: examScoresData, error: scoresError } = await supabase
        .from('exam_scores')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })

      if (scoresError) {
        console.error('Exam scores error:', scoresError)
      }

      // Load exam attempts separately with simpler query
      const { data: attemptsData, error: attemptsError } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('student_id', studentId)
        .in('status', ['completed', 'graded', 'pending_theory', 'submitted'])
        .order('submitted_at', { ascending: false })

      if (attemptsError) {
        console.error('Exam attempts error:', attemptsError)
      }

      // Load exam details for the scores
      let examDetailsMap: Record<string, any> = {}
      if (examScoresData && examScoresData.length > 0) {
        const examIds = [...new Set(examScoresData.map(s => s.exam_id).filter(Boolean))]
        if (examIds.length > 0) {
          const { data: examsData } = await supabase
            .from('exams')
            .select('id, title, subject, has_theory, passing_percentage')
            .in('id', examIds)
          
          if (examsData) {
            examDetailsMap = examsData.reduce((acc, exam) => {
              acc[exam.id] = exam
              return acc
            }, {} as Record<string, any>)
          }
        }
      }

      // Merge the results
      const mergedResults: ExamResult[] = []
      
      // Process exam_scores
      if (examScoresData) {
        for (const score of examScoresData) {
          const attempt = (attemptsData || []).find(a => a.exam_id === score.exam_id)
          const examInfo = examDetailsMap[score.exam_id] || {}
          
          mergedResults.push({
            id: score.id,
            exam_id: score.exam_id,
            exam_title: examInfo.title || score.exam_title || 'Unknown Exam',
            subject: score.subject || examInfo.subject || 'Unknown',
            objective_score: attempt?.objective_score || score.objective_score || 0,
            objective_total: attempt?.objective_total || 20,
            theory_score: attempt?.theory_score ?? score.theory_score ?? null,
            theory_total: attempt?.theory_total || 40,
            total_score: score.total_score || 0,
            percentage: score.percentage || 0,
            grade: score.grade || 'N/A',
            remark: score.remark || 'N/A',
            is_passed: (score.percentage || 0) >= (examInfo.passing_percentage || 50),
            status: score.status || 'completed',
            completed_at: attempt?.submitted_at || score.created_at,
            term: score.term || selectedTerm,
            academic_year: score.academic_year || selectedYear,
            has_theory: examInfo.has_theory || false,
            correct_count: attempt?.correct_count || 0,
            incorrect_count: attempt?.incorrect_count || 0,
            unanswered_count: attempt?.unanswered_count || 0
          })
        }
      }
      
      // Add any attempts without exam_scores
      if (attemptsData) {
        for (const attempt of attemptsData) {
          const existingScore = mergedResults.find(r => r.exam_id === attempt.exam_id)
          if (!existingScore) {
            const examInfo = examDetailsMap[attempt.exam_id] || {}
            const totalScore = (attempt.objective_score || 0) + (attempt.theory_score || 0)
            const totalPossible = (attempt.objective_total || 20) + (attempt.theory_total || 40)
            const percentage = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0
            const { grade, remark } = calculateGradeAndRemark(percentage)
            
            mergedResults.push({
              id: attempt.id,
              exam_id: attempt.exam_id,
              exam_title: examInfo.title || 'Unknown Exam',
              subject: examInfo.subject || 'Unknown',
              objective_score: attempt.objective_score || 0,
              objective_total: attempt.objective_total || 20,
              theory_score: attempt.theory_score ?? null,
              theory_total: attempt.theory_total || 40,
              total_score: totalScore,
              percentage: percentage,
              grade: grade,
              remark: remark,
              is_passed: attempt.is_passed || false,
              status: attempt.status || 'completed',
              completed_at: attempt.submitted_at,
              term: selectedTerm,
              academic_year: selectedYear,
              has_theory: examInfo.has_theory || false,
              correct_count: attempt.correct_count || 0,
              incorrect_count: attempt.incorrect_count || 0,
              unanswered_count: attempt.unanswered_count || 0
            })
          }
        }
      }
      
      setExamResults(mergedResults)
      
      // Calculate stats from merged results
      const completed = mergedResults.filter(r => 
        r.status === 'graded' || r.status === 'completed' || r.status === 'pending_theory'
      )
      const passed = completed.filter(r => r.is_passed)
      const avgScore = completed.length > 0 
        ? completed.reduce((sum, r) => sum + r.percentage, 0) / completed.length 
        : 0
      
      let bestSubject = ''
      let bestScore = 0
      const subjectScores: Record<string, number[]> = {}
      completed.forEach(r => {
        if (!subjectScores[r.subject]) subjectScores[r.subject] = []
        subjectScores[r.subject].push(r.percentage)
      })
      Object.entries(subjectScores).forEach(([subject, scores]) => {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length
        if (avg > bestScore) {
          bestScore = avg
          bestSubject = subject
        }
      })
      
      setStats(prev => ({
        ...prev,
        averageScore: Math.round(avgScore),
        totalExams: completed.length,
        passedExams: passed.length,
        failedExams: completed.length - passed.length,
        bestSubject,
        bestSubjectScore: Math.round(bestScore)
      }))
      
      // ✅ FIX 4: Load CA Scores with maybeSingle() and proper error handling
      const { data: caData, error: caError } = await supabase
        .from('exam_scores')
        .select('*')
        .eq('student_id', studentId)
        .eq('term', selectedTerm)
        .eq('academic_year', selectedYear)
        .order('created_at', { ascending: false })
        
      if (caError) {
        console.error('CA Scores error:', caError)
      }
      
      if (caData && caData.length > 0) {
        setCAScores(caData.map((ca: any) => ({
          id: ca.id,
          subject: ca.subject,
          term: ca.term,
          academic_year: ca.academic_year,
          ca1_score: ca.ca1_score || 0,
          ca2_score: ca.ca2_score || 0,
          exam_objective_score: ca.exam_objective_score || 0,
          exam_theory_score: ca.exam_theory_score || 0,
          exam_total_score: ca.exam_score || 0,
          total_score: ca.total_score || 0,
          grade: ca.grade || 'N/A',
          remark: ca.remark || 'N/A',
          teacher_name: ca.teacher_name || 'Unknown',
          created_at: ca.created_at,
          updated_at: ca.updated_at
        })))
      } else {
        setCAScores([])
      }
      
      // ✅ FIX 5: Load Assessment with maybeSingle()
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('student_assessments')
        .select('*')
        .eq('student_id', studentId)
        .eq('term', selectedTerm)
        .eq('academic_year', selectedYear)
        .maybeSingle()
        
      if (assessmentError) {
        console.error('Assessment error:', assessmentError)
      }
      
      if (assessmentData) {
        setAssessment(assessmentData)
        setAssessmentForm(assessmentData)
        
        const totalDays = (assessmentData.days_present || 0) + (assessmentData.days_absent || 0)
        const attendancePercentage = totalDays > 0 
          ? Math.round((assessmentData.days_present / totalDays) * 100)
          : 94
        
        setStats(prev => ({ ...prev, attendance: attendancePercentage }))
      } else {
        setAssessment(null)
      }
      
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load student data')
    } finally {
      setLoading(false)
    }
  }, [studentId, selectedTerm, selectedYear, router])
  
  useEffect(() => {
    if (studentId) {
      loadData()
    }
  }, [loadData, studentId])
  
  // Handle Logout
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/portal')
  }
  
  // Open CA Dialog for editing
  const handleEditCA = (ca: CAScore) => {
    setEditingCA(ca)
    setCAForm({
      subject: ca.subject,
      ca1_score: ca.ca1_score,
      ca2_score: ca.ca2_score,
      exam_objective_score: ca.exam_objective_score,
      exam_theory_score: ca.exam_theory_score
    })
    setShowCADialog(true)
  }
  
  // Open CA Dialog for new entry
  const handleAddCA = () => {
    setEditingCA(null)
    setCAForm({
      subject: '',
      ca1_score: 0,
      ca2_score: 0,
      exam_objective_score: 0,
      exam_theory_score: 0
    })
    setShowCADialog(true)
  }
  
  // Save CA Score
  const handleSaveCAScore = async () => {
    if (!caForm.subject) {
      toast.error('Please select a subject')
      return
    }
    
    const totalScore = caForm.ca1_score + caForm.ca2_score + 
                      caForm.exam_objective_score + caForm.exam_theory_score
    const { grade, remark } = calculateGradeAndRemark(totalScore)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const caData = {
        student_id: studentId,
        subject: caForm.subject,
        term: selectedTerm,
        academic_year: selectedYear,
        class: student?.class,
        teacher_name: profile?.full_name || 'Teacher',
        ca1_score: caForm.ca1_score,
        ca2_score: caForm.ca2_score,
        exam_objective_score: caForm.exam_objective_score,
        exam_theory_score: caForm.exam_theory_score,
        exam_score: caForm.exam_objective_score + caForm.exam_theory_score,
        total_score: totalScore,
        percentage: totalScore,
        grade,
        remark,
        status: 'completed',
        graded_by: session?.user?.id,
        graded_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      let error
      if (editingCA?.id) {
        const { error: updateError } = await supabase
          .from('exam_scores')
          .update(caData)
          .eq('id', editingCA.id)
        error = updateError
      } else {
        const { error: upsertError } = await supabase
          .from('exam_scores')
          .upsert(caData, {
            onConflict: 'student_id,subject,term,academic_year'
          })
        error = upsertError
      }
        
      if (error) throw error
      
      toast.success(editingCA ? 'CA Score updated!' : 'CA Score saved successfully!')
      setShowCADialog(false)
      setEditingCA(null)
      setCAForm({ subject: '', ca1_score: 0, ca2_score: 0, exam_objective_score: 0, exam_theory_score: 0 })
      loadData()
    } catch (error) {
      console.error('Failed to save CA score:', error)
      toast.error('Failed to save CA score')
    }
  }
  
  // Delete CA Score
  const handleDeleteCA = async (caId: string) => {
    if (!confirm('Are you sure you want to delete this CA score?')) return
    
    try {
      const { error } = await supabase
        .from('exam_scores')
        .delete()
        .eq('id', caId)
        
      if (error) throw error
      
      toast.success('CA Score deleted!')
      loadData()
    } catch (error) {
      console.error('Failed to delete CA score:', error)
      toast.error('Failed to delete CA score')
    }
  }
  
  // Save Assessment
  const handleSaveAssessment = async () => {
    try {
      const assessmentData = {
        student_id: studentId,
        term: selectedTerm,
        academic_year: selectedYear,
        ...assessmentForm,
        updated_at: new Date().toISOString()
      }
      
      let error
      if (assessment?.id) {
        const { error: updateError } = await supabase
          .from('student_assessments')
          .update(assessmentData)
          .eq('id', assessment.id)
        error = updateError
      } else {
        const { error: insertError } = await supabase
          .from('student_assessments')
          .insert({ ...assessmentData, created_at: new Date().toISOString() })
        error = insertError
      }
        
      if (error) throw error
      
      toast.success('Assessment saved successfully!')
      setShowAssessmentDialog(false)
      loadData()
    } catch (error) {
      console.error('Failed to save assessment:', error)
      toast.error('Failed to save assessment')
    }
  }
  
  // Generate AI Comments
  const handleGenerateAIComments = async () => {
    setGeneratingAI(true)
    try {
      const response = await fetch('/api/generate-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: student?.full_name,
          averageScore: stats.averageScore,
          subjects: caScores.map(ca => ({ name: ca.subject, score: ca.total_score, grade: ca.grade })),
          className: student?.class,
          gender: student?.gender || 'student'
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate comments')
      }
      
      const data = await response.json()
      
      setAssessmentForm(prev => ({
        ...prev,
        teacher_comments: data.teacher_comment || prev.teacher_comments,
        principal_comments: data.principal_comment || prev.principal_comments,
        ai_generated_comments: data.teacher_comment
      }))
      
      toast.success('AI comments generated!')
    } catch (error) {
      console.error('Failed to generate AI comments:', error)
      toast.error('Failed to generate AI comments. Using default comments.')
    } finally {
      setGeneratingAI(false)
    }
  }
  
  // Generate Report Card
  const handleGenerateReportCard = async () => {
    setGeneratingReport(true)
    try {
      if (caScores.length === 0) {
        toast.warning('No CA scores found. Please add CA scores before generating report card.')
        setGeneratingReport(false)
        return
      }

      const allSubjectScores = caScores.map(ca => ca.total_score)
      const classHighest = allSubjectScores.length > 0 ? Math.max(...allSubjectScores) : 92
      const classAverage = allSubjectScores.length > 0 
        ? Math.round(allSubjectScores.reduce((a, b) => a + b, 0) / allSubjectScores.length)
        : 72

      const reportData: ReportCardData = {
        schoolName: 'Vincollins College',
        schoolLogo: '/logo.png',
        studentName: student?.full_name || 'Student',
        studentPhoto: student?.photo_url,
        class: student?.class || '',
        admissionNo: student?.vin_id || '',
        term: selectedTerm,
        academicYear: selectedYear,
        gender: student?.gender || 'Student',
        date: new Date().toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        subjects: caScores.map(ca => ({
          name: ca.subject,
          ca1: ca.ca1_score,
          ca2: ca.ca2_score,
          examObj: ca.exam_objective_score,
          examTheory: ca.exam_theory_score,
          total: ca.total_score,
          grade: ca.grade,
          remark: ca.remark,
        })),
        totalScore: caScores.reduce((sum, ca) => sum + ca.total_score, 0),
        averageScore: stats.averageScore,
        position: stats.classRank || 0,
        totalStudents: stats.totalStudents || caScores.length || 1,
        classHighest: classHighest,
        classAverage: classAverage,
        assessment: {
          handwriting: assessment?.handwriting ?? 3,
          sports: assessment?.sports_participation ?? 3,
          creativity: assessment?.creative_arts ?? 3,
          technical: assessment?.technical_skills ?? 3,
          punctuality: assessment?.punctuality ?? 3,
          neatness: assessment?.neatness ?? 3,
          politeness: assessment?.politeness ?? 3,
          cooperation: assessment?.cooperation ?? 3,
          leadership: assessment?.leadership ?? 3,
          daysPresent: assessment?.days_present ?? 0,
          daysAbsent: assessment?.days_absent ?? 0,
        },
        teacherComment: assessment?.teacher_comments || 'No teacher comment yet.',
        principalComment: assessment?.principal_comments || 'No principal comment yet.',
        classTeacher: profile?.full_name || 'Class Teacher',
        principalName: 'Mrs. Nnoli Joy',
      }

      const pdfBlob = await generateSimplePDF(reportData)
      
      const url = window.URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      const fileName = `${student?.full_name?.replace(/\s+/g, '_') || 'student'}_${selectedTerm.replace(/\s+/g, '_')}_${selectedYear.replace(/\//g, '_')}_Report_Card.html`
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.id) {
        await supabase.from('report_cards').upsert({
          student_id: studentId,
          term: selectedTerm,
          academic_year: selectedYear,
          class: student?.class,
          class_teacher: profile?.full_name,
          principal_name: 'Mrs. Nnoli Joy',
          total_score: reportData.totalScore,
          average_score: reportData.averageScore,
          class_highest: reportData.classHighest,
          class_average: reportData.classAverage,
          position: reportData.position,
          total_students: reportData.totalStudents,
          subjects_data: reportData.subjects,
          assessment_data: reportData.assessment,
          teacher_comments: reportData.teacherComment,
          principal_comments: reportData.principalComment,
          status: 'generated',
          generated_by: session.user.id,
          generated_at: new Date().toISOString(),
        }, {
          onConflict: 'student_id,term,academic_year'
        })
      }
      
      toast.success('Report card generated successfully!')
    } catch (error) {
      console.error('Failed to generate report card:', error)
      toast.error('Failed to generate report card')
    } finally {
      setGeneratingReport(false)
    }
  }

  // Print Report Card
  const handlePrintReportCard = async () => {
    await handleGenerateReportCard()
  }
  
  // Navigate to grade exam
  const handleGradeExam = (examId: string) => {
    router.push(`/staff/exams/${examId}/grade?studentId=${studentId}`)
  }
  
  // Fetch exam score from exam_attempts for auto-fill
  const fetchExamScoreForSubject = async (subject: string) => {
    setFetchingExamScore(true)
    try {
      const { data, error } = await supabase
        .from('exam_attempts')
        .select(`
          objective_score,
          theory_score,
          exams!inner(subject)
        `)
        .eq('student_id', studentId)
        .eq('exams.subject', subject)
        .in('status', ['graded', 'completed', 'pending_theory'])
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle()
        
      if (data && !error) {
        setCAForm(prev => ({
          ...prev,
          exam_objective_score: data.objective_score || 0,
          exam_theory_score: data.theory_score || 0
        }))
        toast.success(`Exam scores auto-filled from ${subject} exam`)
      } else {
        toast.info('No exam found for this subject')
      }
    } catch (error) {
      console.error('Failed to fetch exam score:', error)
      toast.error('Failed to fetch exam score')
    } finally {
      setFetchingExamScore(false)
    }
  }
  
  // Calculate total for preview
  const previewTotal = caForm.ca1_score + caForm.ca2_score + caForm.exam_objective_score + caForm.exam_theory_score
  const previewGrade = calculateGradeAndRemark(previewTotal)
  
  // Loading state - CENTERED ON SCREEN
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <Header user={formatProfileForHeader(profile)} onLogout={handleLogout} />
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
              <Loader2 className="relative h-12 w-12 animate-spin text-blue-600" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">Loading student details...</p>
          </div>
        </div>
      </div>
    )
  }
  
  // Student not found state - CENTERED ON SCREEN
  if (!student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <Header user={formatProfileForHeader(profile)} onLogout={handleLogout} />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="h-20 w-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <User className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Student Not Found</h1>
            <p className="text-slate-500 mb-6">The requested student could not be found.</p>
            <Button onClick={() => router.push('/staff/students')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Students
            </Button>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Header user={formatProfileForHeader(profile)} onLogout={handleLogout} />
      
      <div className="flex">
        <StaffSidebar 
          profile={profile}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeTab="students"
          setActiveTab={() => {}}
        />
        
        <main className={cn(
          "flex-1 pt-16 lg:pt-20 pb-8 min-h-screen transition-all duration-300",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
        )}>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
            
            {/* Header with Back Button */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Button variant="outline" onClick={() => router.push('/staff/students')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Roster
                  </Button>
                  <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                    Student Details
                  </h1>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={loadData}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                  </Button>
                  <Button variant="outline" onClick={handlePrintReportCard} disabled={generatingReport}>
                    <Printer className="mr-2 h-4 w-4" /> Print
                  </Button>
                  <Button onClick={handleGenerateReportCard} disabled={generatingReport}>
                    {generatingReport ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Generate Report Card
                  </Button>
                </div>
              </div>
            </motion.div>
            
            {/* Student Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500/5 via-white to-indigo-500/5 dark:from-blue-950/20 dark:via-slate-900 dark:to-indigo-950/20 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-start gap-6">
                    <div className="relative">
                      {student?.photo_url ? (
                        <Avatar className="h-24 w-24 md:h-32 md:w-32 ring-4 ring-white dark:ring-slate-900 shadow-xl">
                          <AvatarImage src={student.photo_url} alt={student.full_name} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-3xl font-bold">
                            {getInitials(student.full_name)}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="h-24 w-24 md:h-32 md:w-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-xl ring-4 ring-white dark:ring-slate-900">
                          {getInitials(student?.full_name)}
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1">
                        <div className="relative h-4 w-4 bg-green-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
                      </div>
                    </div>
                    
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{student?.full_name}</h2>
                        <p className="text-slate-500 flex items-center gap-1 mt-1">
                          <Mail className="h-3.5 w-3.5" /> {student?.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Class</p>
                        <Badge className="mt-1 text-sm bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          {student?.class}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Admission No</p>
                        <p className="font-mono font-medium text-slate-900 dark:text-white">{student?.vin_id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Department</p>
                        <p className="font-medium text-slate-900 dark:text-white">{student?.department || 'General'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Admission Year</p>
                        <p className="font-medium text-slate-900 dark:text-white">{student?.admission_year || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Gender</p>
                        <p className="font-medium text-slate-900 dark:text-white">{student?.gender || 'N/A'}</p>
                      </div>
                      {student?.parent_name && (
                        <div>
                          <p className="text-sm text-slate-500">Parent/Guardian</p>
                          <p className="font-medium text-slate-900 dark:text-white">{student.parent_name}</p>
                          {student.parent_phone && (
                            <p className="text-xs text-slate-500">{student.parent_phone}</p>
                          )}
                        </div>
                      )}
                      {student?.phone && (
                        <div>
                          <p className="text-sm text-slate-500">Phone</p>
                          <p className="font-medium text-slate-900 dark:text-white">{student.phone}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            {/* Term/Year Selector */}
            <div className="flex items-center gap-4 mb-6">
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {terms.map(term => <SelectItem key={term} value={term}>{term}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            {/* Main Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <Activity className="h-4 w-4 mr-2" /> Overview
                </TabsTrigger>
                <TabsTrigger value="ca-scores" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <FileText className="h-4 w-4 mr-2" /> CA Scores
                </TabsTrigger>
                <TabsTrigger value="exam-results" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <Award className="h-4 w-4 mr-2" /> Exam Results
                </TabsTrigger>
                <TabsTrigger value="assessment" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <Star className="h-4 w-4 mr-2" /> Assessment
                </TabsTrigger>
              </TabsList>
              
              {/* OVERVIEW TAB */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-500">Average Score</p>
                          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.averageScore}%</p>
                        </div>
                        <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <TrendingUp className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-500">Exams Taken</p>
                          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalExams}</p>
                        </div>
                        <div className="h-10 w-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-green-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-500">Passed / Failed</p>
                          <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {stats.passedExams}/{stats.failedExams}
                          </p>
                        </div>
                        <div className="h-10 w-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                          <Trophy className="h-5 w-5 text-yellow-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-500">Attendance</p>
                          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.attendance}%</p>
                        </div>
                        <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-purple-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Best Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {stats.bestSubject ? (
                        <div className="text-center py-4">
                          <Trophy className="h-12 w-12 text-amber-500 mx-auto mb-2" />
                          <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.bestSubject}</p>
                          <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{stats.bestSubjectScore}%</p>
                        </div>
                      ) : (
                        <p className="text-center text-slate-500 py-8">No exam results yet</p>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Recent Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {examResults.length > 0 ? (
                        <div className="space-y-3">
                          {examResults.slice(0, 3).map(result => (
                            <div key={result.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                              <div>
                                <p className="font-medium text-slate-900 dark:text-white">{result.subject}</p>
                                <p className="text-xs text-slate-500">{result.exam_title}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-slate-900 dark:text-white">{result.percentage}%</p>
                                <Badge className={getGradeColor(result.grade)}>{result.grade}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-slate-500 py-8">No exam results yet</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              {/* CA SCORES TAB */}
              <TabsContent value="ca-scores">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Continuous Assessment Scores</CardTitle>
                      <CardDescription>{selectedTerm} - {selectedYear} (CA1: 20 marks, CA2: 20 marks, Exam: 60 marks)</CardDescription>
                    </div>
                    <Button onClick={handleAddCA}>
                      <Plus className="mr-2 h-4 w-4" /> Add CA Score
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {caScores.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No CA scores for this term</p>
                        <Button variant="link" onClick={handleAddCA} className="mt-2">
                          Add your first CA score
                        </Button>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Subject</TableHead>
                            <TableHead className="text-center">CA1 (20)</TableHead>
                            <TableHead className="text-center">CA2 (20)</TableHead>
                            <TableHead className="text-center">Exam (60)</TableHead>
                            <TableHead className="text-center">Total (100)</TableHead>
                            <TableHead className="text-center">Grade</TableHead>
                            <TableHead>Remark</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {caScores.map(ca => (
                            <TableRow key={ca.id}>
                              <TableCell className="font-medium">{ca.subject}</TableCell>
                              <TableCell className="text-center">{ca.ca1_score}</TableCell>
                              <TableCell className="text-center">{ca.ca2_score}</TableCell>
                              <TableCell className="text-center">{ca.exam_total_score}/60</TableCell>
                              <TableCell className="text-center font-bold">{ca.total_score}</TableCell>
                              <TableCell className="text-center">
                                <Badge className={getGradeColor(ca.grade)}>{ca.grade}</Badge>
                              </TableCell>
                              <TableCell>{ca.remark}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button variant="ghost" size="icon" onClick={() => handleEditCA(ca)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleDeleteCA(ca.id)}>
                                    <XCircle className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* EXAM RESULTS TAB */}
              <TabsContent value="exam-results">
                <Card>
                  <CardHeader>
                    <CardTitle>Exam Results History</CardTitle>
                    <CardDescription>All exam attempts and scores</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {examResults.length === 0 ? (
                      <div className="text-center py-12">
                        <Award className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No exam results yet</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Exam</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead className="text-center">Objective</TableHead>
                            <TableHead className="text-center">Theory</TableHead>
                            <TableHead className="text-center">Total</TableHead>
                            <TableHead className="text-center">Grade</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {examResults.map(result => (
                            <TableRow key={result.id}>
                              <TableCell>
                                <p className="font-medium">{result.exam_title}</p>
                                <p className="text-xs text-slate-500">
                                  {result.completed_at ? new Date(result.completed_at).toLocaleDateString() : 'N/A'}
                                </p>
                              </TableCell>
                              <TableCell>{result.subject}</TableCell>
                              <TableCell className="text-center">
                                {result.objective_score}/{result.objective_total}
                              </TableCell>
                              <TableCell className="text-center">
                                {result.theory_score !== null ? `${result.theory_score}/${result.theory_total}` : 'Pending'}
                              </TableCell>
                              <TableCell className="text-center font-bold">
                                {result.total_score}/{result.objective_total + result.theory_total}
                                <span className="text-xs text-slate-500 ml-1">({result.percentage}%)</span>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className={getGradeColor(result.grade)}>{result.grade}</Badge>
                              </TableCell>
                              <TableCell>
                                {result.status === 'pending_theory' ? (
                                  <Badge className="bg-yellow-100 text-yellow-700">Pending Theory</Badge>
                                ) : result.is_passed ? (
                                  <Badge className="bg-green-100 text-green-700">Passed</Badge>
                                ) : (
                                  <Badge className="bg-red-100 text-red-700">Failed</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {result.status === 'pending_theory' && result.has_theory ? (
                                  <Button size="sm" onClick={() => handleGradeExam(result.exam_id)}>
                                    <Eye className="mr-1 h-4 w-4" /> Grade
                                  </Button>
                                ) : (
                                  <Button size="sm" variant="outline">
                                    <Eye className="mr-1 h-4 w-4" /> View
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* ASSESSMENT TAB */}
              <TabsContent value="assessment">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Psychomotor & Behavioral Assessment</CardTitle>
                      <CardDescription>{selectedTerm} - {selectedYear}</CardDescription>
                    </div>
                    <Button onClick={() => setShowAssessmentDialog(true)}>
                      {assessment ? <Edit className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                      {assessment ? 'Edit Assessment' : 'Add Assessment'}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {!assessment ? (
                      <div className="text-center py-12">
                        <Star className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No assessment for this term</p>
                        <Button variant="link" onClick={() => setShowAssessmentDialog(true)} className="mt-2">
                          Add assessment
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div>
                          <h4 className="font-semibold mb-3">Psychomotor Skills</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-sm text-slate-500">Handwriting</p>
                              <StarRating value={assessment.handwriting} readonly />
                            </div>
                            <div>
                              <p className="text-sm text-slate-500">Sports Participation</p>
                              <StarRating value={assessment.sports_participation} readonly />
                            </div>
                            <div>
                              <p className="text-sm text-slate-500">Creative Arts</p>
                              <StarRating value={assessment.creative_arts} readonly />
                            </div>
                            <div>
                              <p className="text-sm text-slate-500">Technical Skills</p>
                              <StarRating value={assessment.technical_skills} readonly />
                            </div>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h4 className="font-semibold mb-3">Behavioral Traits</h4>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div>
                              <p className="text-sm text-slate-500">Punctuality</p>
                              <StarRating value={assessment.punctuality} readonly />
                            </div>
                            <div>
                              <p className="text-sm text-slate-500">Neatness</p>
                              <StarRating value={assessment.neatness} readonly />
                            </div>
                            <div>
                              <p className="text-sm text-slate-500">Politeness</p>
                              <StarRating value={assessment.politeness} readonly />
                            </div>
                            <div>
                              <p className="text-sm text-slate-500">Cooperation</p>
                              <StarRating value={assessment.cooperation} readonly />
                            </div>
                            <div>
                              <p className="text-sm text-slate-500">Leadership</p>
                              <StarRating value={assessment.leadership} readonly />
                            </div>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h4 className="font-semibold mb-3">Attendance</h4>
                          <div className="flex gap-8">
                            <div>
                              <p className="text-sm text-slate-500">Days Present</p>
                              <p className="text-2xl font-bold text-green-600">{assessment.days_present}</p>
                            </div>
                            <div>
                              <p className="text-sm text-slate-500">Days Absent</p>
                              <p className="text-2xl font-bold text-red-600">{assessment.days_absent}</p>
                            </div>
                            <div>
                              <p className="text-sm text-slate-500">Total Days</p>
                              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                {(assessment.days_present || 0) + (assessment.days_absent || 0)}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h4 className="font-semibold mb-3">Teacher's Comments</h4>
                          <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                            {assessment.teacher_comments || 'No comments yet'}
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-3">Principal's Comments</h4>
                          <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                            {assessment.principal_comments || 'No comments yet'}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
      
      {/* Add/Edit CA Score Dialog */}
      <Dialog open={showCADialog} onOpenChange={setShowCADialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCA ? 'Edit CA Score' : 'Add CA Score'}</DialogTitle>
            <DialogDescription>
              {selectedTerm} {selectedYear} - CA1: 20 marks, CA2: 20 marks, Exam: 60 marks = Total: 100 marks
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Subject *</Label>
              <Select value={caForm.subject} onValueChange={(v) => setCAForm({ ...caForm, subject: v })} disabled={!!editingCA}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>CA1 Score (max 20)</Label>
                <Input
                  type="number"
                  min="0"
                  max="20"
                  step="0.5"
                  value={caForm.ca1_score}
                  onChange={(e) => setCAForm({ ...caForm, ca1_score: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>CA2 Score (max 20)</Label>
                <Input
                  type="number"
                  min="0"
                  max="20"
                  step="0.5"
                  value={caForm.ca2_score}
                  onChange={(e) => setCAForm({ ...caForm, ca2_score: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            
            <Separator />
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Exam Score (max 60)</Label>
                {caForm.subject && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fetchExamScoreForSubject(caForm.subject)}
                    disabled={fetchingExamScore}
                  >
                    {fetchingExamScore ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                      <CheckCheck className="mr-2 h-3 w-3" />
                    )}
                    Auto-fill from CBT
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Objective Score</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={caForm.exam_objective_score}
                    onChange={(e) => setCAForm({ ...caForm, exam_objective_score: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Theory Score</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={caForm.exam_theory_score}
                    onChange={(e) => setCAForm({ ...caForm, exam_theory_score: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Exam Total: {caForm.exam_objective_score + caForm.exam_theory_score}/60
              </p>
            </div>
            
            <Separator />
            
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg p-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Score Preview</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {previewTotal}/100
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={cn("text-sm px-3 py-1", getGradeColor(previewGrade.grade))}>
                  {previewGrade.grade}
                </Badge>
                <span className="text-sm text-slate-600 dark:text-slate-400">{previewGrade.remark}</span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCADialog(false)}>Cancel</Button>
            <Button onClick={handleSaveCAScore}>
              <Save className="mr-2 h-4 w-4" /> {editingCA ? 'Update' : 'Save'} Score
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Assessment Dialog */}
      <Dialog open={showAssessmentDialog} onOpenChange={setShowAssessmentDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Student Assessment</DialogTitle>
            <DialogDescription>
              Psychomotor skills, behavioral traits, and comments for {selectedTerm} {selectedYear}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div>
              <h4 className="font-semibold mb-3">Psychomotor Skills</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Handwriting</Label>
                  <StarRating 
                    value={assessmentForm.handwriting || 3} 
                    onChange={(v) => setAssessmentForm({ ...assessmentForm, handwriting: v })}
                  />
                </div>
                <div>
                  <Label>Sports Participation</Label>
                  <StarRating 
                    value={assessmentForm.sports_participation || 3} 
                    onChange={(v) => setAssessmentForm({ ...assessmentForm, sports_participation: v })}
                  />
                </div>
                <div>
                  <Label>Creative Arts</Label>
                  <StarRating 
                    value={assessmentForm.creative_arts || 3} 
                    onChange={(v) => setAssessmentForm({ ...assessmentForm, creative_arts: v })}
                  />
                </div>
                <div>
                  <Label>Technical Skills</Label>
                  <StarRating 
                    value={assessmentForm.technical_skills || 3} 
                    onChange={(v) => setAssessmentForm({ ...assessmentForm, technical_skills: v })}
                  />
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-semibold mb-3">Behavioral Traits</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Punctuality</Label>
                  <StarRating 
                    value={assessmentForm.punctuality || 3} 
                    onChange={(v) => setAssessmentForm({ ...assessmentForm, punctuality: v })}
                  />
                </div>
                <div>
                  <Label>Neatness</Label>
                  <StarRating 
                    value={assessmentForm.neatness || 3} 
                    onChange={(v) => setAssessmentForm({ ...assessmentForm, neatness: v })}
                  />
                </div>
                <div>
                  <Label>Politeness</Label>
                  <StarRating 
                    value={assessmentForm.politeness || 3} 
                    onChange={(v) => setAssessmentForm({ ...assessmentForm, politeness: v })}
                  />
                </div>
                <div>
                  <Label>Cooperation</Label>
                  <StarRating 
                    value={assessmentForm.cooperation || 3} 
                    onChange={(v) => setAssessmentForm({ ...assessmentForm, cooperation: v })}
                  />
                </div>
                <div>
                  <Label>Leadership</Label>
                  <StarRating 
                    value={assessmentForm.leadership || 3} 
                    onChange={(v) => setAssessmentForm({ ...assessmentForm, leadership: v })}
                  />
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-semibold mb-3">Attendance</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Days Present</Label>
                  <Input
                    type="number"
                    min="0"
                    value={assessmentForm.days_present}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, days_present: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Days Absent</Label>
                  <Input
                    type="number"
                    min="0"
                    value={assessmentForm.days_absent}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, days_absent: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">Teacher's Comments</h4>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleGenerateAIComments}
                  disabled={generatingAI}
                >
                  {generatingAI ? (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-3 w-3" />
                  )}
                  Generate with AI
                </Button>
              </div>
              <Textarea
                placeholder="Enter teacher's comments..."
                rows={3}
                value={assessmentForm.teacher_comments || ''}
                onChange={(e) => setAssessmentForm({ ...assessmentForm, teacher_comments: e.target.value })}
              />
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Principal's Comments</h4>
              <Textarea
                placeholder="Enter principal's comments..."
                rows={3}
                value={assessmentForm.principal_comments || ''}
                onChange={(e) => setAssessmentForm({ ...assessmentForm, principal_comments: e.target.value })}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssessmentDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveAssessment}>
              <Save className="mr-2 h-4 w-4" /> Save Assessment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}