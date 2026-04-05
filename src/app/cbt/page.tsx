/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ExamCard } from '@/components/cbt/exam-card'
import { SecureExamInterface } from '@/components/cbt/secure-exam-interface'
import { ResultCard } from '@/components/cbt/result-card'
import { motion } from 'framer-motion'
import { 
  BookOpen, Clock, Award, Shield, GraduationCap,
  Users, Search, Sparkles, FileText, LayoutGrid, List, 
  Calculator, Languages, Microscope, Globe,
  History, Music, Briefcase, Paintbrush, Code, Atom,
  Filter, ChevronDown, Bell, Eye, BarChart3,
  Heart, Star, Sprout, Activity, PenTool, LineChart,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'react-hot-toast'

// Subject data for quick filtering
const juniorSubjects = [
  { name: 'Mathematics', icon: Calculator, color: 'bg-blue-100 text-blue-600' },
  { name: 'English Studies', icon: Languages, color: 'bg-green-100 text-green-600' },
  { name: 'Basic Science', icon: Microscope, color: 'bg-teal-100 text-teal-600' },
  { name: 'Basic Technology', icon: Atom, color: 'bg-cyan-100 text-cyan-600' },
  { name: 'Social Studies', icon: Globe, color: 'bg-emerald-100 text-emerald-600' },
  { name: 'Civic Education', icon: Shield, color: 'bg-indigo-100 text-indigo-600' },
  { name: 'History', icon: History, color: 'bg-amber-100 text-amber-600' },
  { name: 'Music', icon: Music, color: 'bg-fuchsia-100 text-fuchsia-600' },
]

const seniorScienceSubjects = [
  { name: 'Mathematics', icon: Calculator, color: 'bg-blue-100 text-blue-600' },
  { name: 'Physics', icon: Atom, color: 'bg-cyan-100 text-cyan-600' },
  { name: 'Chemistry', icon: BeakerIcon, color: 'bg-purple-100 text-purple-600' },
  { name: 'Biology', icon: Microscope, color: 'bg-emerald-100 text-emerald-600' },
  { name: 'Further Mathematics', icon: Calculator, color: 'bg-indigo-100 text-indigo-600' },
  { name: 'Computer Science', icon: Code, color: 'bg-slate-100 text-slate-600' },
  { name: 'Economics', icon: LineChart, color: 'bg-yellow-100 text-yellow-600' },
]

const seniorArtsSubjects = [
  { name: 'English', icon: Languages, color: 'bg-green-100 text-green-600' },
  { name: 'Literature', icon: BookOpen, color: 'bg-amber-100 text-amber-600' },
  { name: 'Government', icon: Shield, color: 'bg-blue-100 text-blue-600' },
  { name: 'History', icon: History, color: 'bg-rose-100 text-rose-600' },
  { name: 'Economics', icon: LineChart, color: 'bg-yellow-100 text-yellow-600' },
  { name: 'Geography', icon: Globe, color: 'bg-emerald-100 text-emerald-600' },
  { name: 'CRS', icon: Heart, color: 'bg-pink-100 text-pink-600' },
]

// Helper components
function BeakerIcon({ className }: { className?: string }) {
  return <span className={className}>🧪</span>
}

function LayoutGridIcon({ className }: { className?: string }) {
  return <LayoutGrid className={className} />
}

function ListIcon({ className }: { className?: string }) {
  return <List className={className} />
}

// Access Code Modal Component
function AccessCodeModal({ exam, onVerify, onClose }: any) {
  const [code, setCode] = useState('')

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="max-w-md w-full mx-4 p-6">
        <h3 className="text-xl font-bold mb-2">Access Code Required</h3>
        <p className="text-gray-600 mb-4">This exam requires an access code. Please enter the code provided by your teacher.</p>
        <Input
          placeholder="Enter access code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="mb-4"
        />
        <div className="flex gap-2">
          <Button onClick={() => onVerify(code)} className="flex-1">Verify</Button>
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
        </div>
      </Card>
    </div>
  )
}

export default function CBTPlatform() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()
  
  // State Management
  const [exams, setExams] = useState<any[]>([])
  const [filteredExams, setFilteredExams] = useState<any[]>([])
  const [selectedExam, setSelectedExam] = useState<any>(null)
  const [examQuestions, setExamQuestions] = useState<any[]>([])
  const [examResult, setExamResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'junior' | 'senior-science' | 'senior-arts'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [activeTab, setActiveTab] = useState<'practice' | 'published'>('practice')
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showAccessCodeModal, setShowAccessCodeModal] = useState(false)
  const [selectedExamForCode, setSelectedExamForCode] = useState<any>(null)
  
  // Stats
  const [stats, setStats] = useState({
    totalExams: 0,
    practiceExams: 0,
    publishedExams: 0,
    averageDuration: 0
  })

  // Check user session
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(profile)
    }
    
    getUser()
  }, [router, supabase])

  // Load exams
  useEffect(() => {
    const loadExams = async () => {
      if (!user) return
      
      setIsLoading(true)
      
      try {
        // Fetch exams from Supabase
        const { data: examsData, error: examsError } = await supabase
          .from('exams')
          .select(`
            *,
            subjects (name)
          `)
          .eq('status', 'published')
          .order('created_at', { ascending: false })

        if (examsError) throw examsError
        
        const formattedExams = examsData?.map(exam => ({
          id: exam.id,
          title: exam.title,
          subject: exam.subjects?.name || 'General',
          category: exam.category || 'junior',
          class: exam.class,
          duration: exam.duration,
          total_questions: exam.total_questions,
          status: exam.status,
          instructions: exam.instructions,
          passing_score: exam.pass_mark,
          is_practice: exam.is_practice || false,
          created_by: exam.created_by
        })) || []
        
        setExams(formattedExams)
        
        setStats({
          totalExams: formattedExams.length,
          practiceExams: formattedExams.filter(e => e.is_practice).length,
          publishedExams: formattedExams.filter(e => e.status === 'published' && !e.is_practice).length,
          averageDuration: formattedExams.length > 0 
            ? Math.round(formattedExams.reduce((acc, e) => acc + e.duration, 0) / formattedExams.length)
            : 0
        })
        
      } catch (error) {
        console.error('Error loading exams:', error)
        toast.error('Failed to load exams')
        
        // Fallback mock data
        const mockExams = [
          {
            id: '1',
            title: 'JSS3 Mathematics Mock Exam',
            subject: 'Mathematics',
            category: 'junior',
            class: 'JSS3',
            duration: 60,
            total_questions: 50,
            status: 'published',
            instructions: 'Answer all questions to the best of your ability.',
            passing_score: 50,
            is_practice: false,
          },
          {
            id: '2',
            title: 'SS2 Physics Practice Test',
            subject: 'Physics',
            category: 'senior-science',
            class: 'SS2',
            duration: 45,
            total_questions: 40,
            status: 'published',
            instructions: 'Practice questions for Physics examination.',
            passing_score: 0,
            is_practice: true,
          },
          {
            id: '3',
            title: 'SS1 Literature Quiz',
            subject: 'Literature in English',
            category: 'senior-arts',
            class: 'SS1',
            duration: 30,
            total_questions: 25,
            status: 'published',
            instructions: 'Choose the correct option for each question.',
            passing_score: 60,
            is_practice: false,
          },
          {
            id: '4',
            title: 'JSS2 Basic Science Test',
            subject: 'Basic Science',
            category: 'junior',
            class: 'JSS2',
            duration: 40,
            total_questions: 35,
            status: 'published',
            instructions: 'Answer all questions.',
            passing_score: 50,
            is_practice: true,
          },
          {
            id: '5',
            title: 'SS3 Chemistry Mock',
            subject: 'Chemistry',
            category: 'senior-science',
            class: 'SS3',
            duration: 90,
            total_questions: 60,
            status: 'published',
            instructions: 'This is a mock examination for SS3 students.',
            passing_score: 50,
            is_practice: false,
          },
          {
            id: '6',
            title: 'SS2 Government Exam',
            subject: 'Government',
            category: 'senior-arts',
            class: 'SS2',
            duration: 50,
            total_questions: 45,
            status: 'published',
            instructions: 'Answer all questions.',
            passing_score: 50,
            is_practice: false,
          }
        ]
        
        setExams(mockExams)
        setStats({
          totalExams: mockExams.length,
          practiceExams: mockExams.filter(e => e.is_practice).length,
          publishedExams: mockExams.filter(e => e.status === 'published' && !e.is_practice).length,
          averageDuration: Math.round(mockExams.reduce((acc, e) => acc + e.duration, 0) / mockExams.length)
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    loadExams()
  }, [user, supabase])

  // Filter exams based on search and filters
  useEffect(() => {
    let filtered = [...exams]
    
    // Filter by practice/published tab
    if (activeTab === 'practice') {
      filtered = filtered.filter(e => e.is_practice === true)
    } else {
      filtered = filtered.filter(e => e.is_practice === false)
    }
    
    if (searchQuery) {
      filtered = filtered.filter(e => 
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.subject.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    if (selectedSubject !== 'all') {
      filtered = filtered.filter(e => e.subject === selectedSubject)
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(e => e.category === selectedCategory)
    }
    
    setFilteredExams(filtered)
  }, [searchQuery, selectedSubject, selectedCategory, exams, activeTab])

  const handleStartExam = async (exam: any) => {
    if (exam.requires_access_code) {
      setSelectedExamForCode(exam)
      setShowAccessCodeModal(true)
      return
    }
    
    // Fetch questions for this exam
    try {
      const { data: questions, error } = await supabase
        .from('questions')
        .select(`
          *,
          options (*)
        `)
        .eq('exam_id', exam.id)

      if (error) throw error
      
      const formattedQuestions = questions?.map(q => ({
        id: q.id,
        question_text: q.question_text,
        type: q.question_type === 'multiple_choice' ? 'objective' : 'theory',
        options: q.options?.map((opt: any) => opt.option_text),
        points: q.points,
        correct_answer: q.options?.find((opt: any) => opt.is_correct)?.option_text
      })) || []
      
      setSelectedExam(exam)
      setExamQuestions(formattedQuestions)
    } catch (error) {
      console.error('Error loading questions:', error)
      toast.error('Failed to load exam questions')
    }
  }

  const handleSubmitExam = async (answers: Record<string, any>, timeSpent: number) => {
    try {
      let correctCount = 0
      const totalPoints = examQuestions.reduce((sum, q) => sum + q.points, 0)
      let earnedPoints = 0
      
      for (const question of examQuestions) {
        const answer = answers[question.id]
        if (question.correct_answer === answer) {
          correctCount++
          earnedPoints += question.points
        }
      }
      
      const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0
      let grade = 'F'
      if (percentage >= 80) grade = 'A'
      else if (percentage >= 70) grade = 'B'
      else if (percentage >= 60) grade = 'C'
      else if (percentage >= 50) grade = 'D'
      
      // Save result to Supabase
      if (user) {
        const { error: resultError } = await supabase
          .from('exam_attempts')
          .insert({
            student_id: user.id,
            exam_id: selectedExam.id,
            status: 'submitted',
            time_spent: timeSpent,
            total_score: earnedPoints,
            percentage_score: percentage,
            is_passed: percentage >= (selectedExam.passing_score || 50)
          })
        
        if (resultError) {
          console.error('Error saving result:', resultError)
        }
      }
      
      setExamResult({
        exam_title: selectedExam.title,
        score: earnedPoints,
        total: totalPoints,
        percentage,
        grade,
        time_spent: timeSpent,
        correct_answers: correctCount,
        wrong_answers: examQuestions.length - correctCount,
        submitted_at: new Date().toISOString(),
      })
      
      toast.success('Exam submitted successfully!')
    } catch (error) {
      console.error('Error submitting exam:', error)
      toast.error('Failed to submit exam')
    }
  }

  const handleRetake = () => {
    setExamResult(null)
    setSelectedExam(null)
    setExamQuestions([])
  }

  const getSubjects = () => {
    if (!profile) return juniorSubjects
    const studentCategory = profile.category || profile.student_category || 'junior'
    if (studentCategory === 'junior') return juniorSubjects
    if (studentCategory === 'senior-science') return seniorScienceSubjects
    if (studentCategory === 'senior-arts') return seniorArtsSubjects
    return juniorSubjects
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-gray-600">Loading your CBT platform...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (examResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <ResultCard 
            result={examResult} 
            onDownload={() => toast.success('Certificate download started')}
          />
          <div className="text-center mt-8">
            <button
              onClick={handleRetake}
              className="text-primary hover:text-primary/80 font-medium inline-flex items-center gap-2"
            >
              ← Back to Exams
            </button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (selectedExam) {
    return (
      <SecureExamInterface
        examId={selectedExam.id}
        userId={user?.id || 'guest'}
        examTitle={selectedExam.title}
        duration={selectedExam.duration}
        questions={examQuestions}
        onSubmit={handleSubmitExam}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8 lg:py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-primary" />
            <span className="text-sm font-medium text-primary">CBT Platform</span>
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4 font-serif">
            Vincollins CBT Platform
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {profile?.role === 'student' 
              ? `Welcome back, ${profile?.full_name?.split(' ')[0] || 'Student'}! Prepare for your ${profile?.category === 'junior' ? 'Junior Secondary' : profile?.category === 'senior-science' ? 'Senior Science' : 'Senior Arts'} examinations.`
              : profile?.role === 'teacher'
              ? 'Create, manage, and publish exams. Track student performance and generate reports.'
              : 'Comprehensive Computer-Based Testing for Junior and Senior Secondary Students'}
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-4">
              <BookOpen className="h-8 w-8 mb-2 opacity-80" />
              <p className="text-2xl font-bold">{stats.totalExams}</p>
              <p className="text-sm opacity-80">Total Exams</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-4">
              <Sparkles className="h-8 w-8 mb-2 opacity-80" />
              <p className="text-2xl font-bold">{stats.practiceExams}</p>
              <p className="text-sm opacity-80">Practice Mode</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-4">
              <Shield className="h-8 w-8 mb-2 opacity-80" />
              <p className="text-2xl font-bold">{stats.publishedExams}</p>
              <p className="text-sm opacity-80">Published Exams</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="p-4">
              <Clock className="h-8 w-8 mb-2 opacity-80" />
              <p className="text-2xl font-bold">{stats.averageDuration}</p>
              <p className="text-sm opacity-80">Avg. Minutes</p>
            </CardContent>
          </Card>
        </div>

        {/* Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 hover:scale-105 transition-transform duration-300 cursor-pointer">
            <CardContent className="p-6">
              <GraduationCap className="h-10 w-10 mb-3" />
              <h3 className="text-xl font-bold mb-1">Junior Secondary</h3>
              <p className="text-blue-100 text-sm">JSS 1 - JSS 3</p>
              <p className="text-2xl font-bold mt-3">17 Subjects</p>
              <Badge className="mt-3 bg-white/20 text-white border-0">Mathematics, English, Basic Science...</Badge>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 hover:scale-105 transition-transform duration-300 cursor-pointer">
            <CardContent className="p-6">
              <BeakerIcon className="h-10 w-10 mb-3" />
              <h3 className="text-xl font-bold mb-1">Senior Science</h3>
              <p className="text-green-100 text-sm">SS 1 - SS 3</p>
              <p className="text-2xl font-bold mt-3">10 Subjects</p>
              <Badge className="mt-3 bg-white/20 text-white border-0">Physics, Chemistry, Biology, Mathematics...</Badge>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 hover:scale-105 transition-transform duration-300 cursor-pointer">
            <CardContent className="p-6">
              <BookOpen className="h-10 w-10 mb-3" />
              <h3 className="text-xl font-bold mb-1">Senior Arts</h3>
              <p className="text-purple-100 text-sm">SS 1 - SS 3</p>
              <p className="text-2xl font-bold mt-3">10 Subjects</p>
              <Badge className="mt-3 bg-white/20 text-white border-0">Literature, Government, History, Economics...</Badge>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Practice vs Published */}
        {profile?.role === 'student' && (
          <div className="flex justify-center mb-8">
            <Tabs defaultValue="practice" className="w-full max-w-md" onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="practice" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Practice Mode
                </TabsTrigger>
                <TabsTrigger value="published" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Published Exams
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search exams by title or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-full"
            />
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            {profile?.role === 'student' && (
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {getSubjects().map(subject => (
                    <SelectItem key={subject.name} value={subject.name}>
                      <div className="flex items-center gap-2">
                        <subject.icon className="h-4 w-4" />
                        {subject.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {profile?.role === 'teacher' && (
              <>
                <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as any)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="junior">Junior Secondary</SelectItem>
                    <SelectItem value="senior-science">Senior Science</SelectItem>
                    <SelectItem value="senior-arts">Senior Arts</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {[...juniorSubjects, ...seniorScienceSubjects, ...seniorArtsSubjects].map(subject => (
                      <SelectItem key={subject.name} value={subject.name}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
            
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 w-8 p-0"
              >
                <LayoutGridIcon className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 w-8 p-0"
              >
                <ListIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Subject Filters */}
        {profile?.role === 'student' && getSubjects().length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Subjects</h3>
            <div className="flex flex-wrap gap-2">
              {getSubjects().slice(0, 8).map(subject => {
                const Icon = subject.icon
                return (
                  <button
                    key={subject.name}
                    onClick={() => setSelectedSubject(selectedSubject === subject.name ? 'all' : subject.name)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all duration-300",
                      selectedSubject === subject.name
                        ? "bg-primary text-white shadow-md"
                        : `${subject.color} hover:opacity-80`
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{subject.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Exams Grid/List */}
        {filteredExams.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
              <BookOpen className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No exams found</h3>
            <p className="text-gray-500">
              {activeTab === 'practice' 
                ? 'No practice exams available at the moment. Check back later!'
                : profile?.role === 'student'
                ? 'No published exams available for your level yet. Please check with your teacher.'
                : 'No exams created yet.'}
            </p>
            {profile?.role === 'teacher' && (
              <Button onClick={() => setShowUploadDialog(true)} className="mt-4">
                <FileText className="mr-2 h-4 w-4" />
                Create Your First Exam
              </Button>
            )}
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {filteredExams.map((exam, index) => (
              <ExamCard
                key={exam.id}
                exam={exam}
                onStart={() => handleStartExam(exam)}
                index={index}
                userRole={profile?.role}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3 mb-12">
            {filteredExams.map((exam, index) => (
              <ExamCard
                key={exam.id}
                exam={exam}
                onStart={() => handleStartExam(exam)}
                variant="list"
                index={index}
                userRole={profile?.role}
              />
            ))}
          </div>
        )}
      </main>
      
      <Footer />

      {/* Access Code Modal */}
      {showAccessCodeModal && selectedExamForCode && (
        <AccessCodeModal
          exam={selectedExamForCode}
          onVerify={async (code: string) => {
            if (code === '1234') {
              setShowAccessCodeModal(false)
              handleStartExam(selectedExamForCode)
            } else {
              toast.error('Invalid access code')
            }
          }}
          onClose={() => setShowAccessCodeModal(false)}
        />
      )}
    </div>
  )
}