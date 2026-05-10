
/* eslint-disable @typescript-eslint/no-unused-vars */
// app/student/help/page.tsx - SECURE: No Self-Service Password Reset, Contact Support Only
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { StudentSidebar } from '@/components/student/StudentSidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Loader2, HelpCircle, MessageCircle, Phone, Mail, MapPin,
  ChevronRight, Home, ArrowLeft, Send, FileText,
  BookOpen, Award, Search, User, Shield,
  Bot, X, Minimize2, Maximize2, Sparkles, Clock, ThumbsUp, ThumbsDown
} from 'lucide-react'
import Link from 'next/link'

// ============================================
// INTERFACES
// ============================================
interface StudentProfile {
  id: string
  full_name: string
  email: string
  class: string
  department: string
  vin_id?: string
  photo_url?: string | null
}

// FAQ Data
const faqData = [
  {
    category: 'exams',
    question: 'How do I take an exam?',
    answer: 'Go to the "My Exams" page from your dashboard or sidebar. You\'ll see a list of available exams. Click "Start Exam" on any exam to begin. Make sure you have a stable internet connection and are ready before starting.'
  },
  {
    category: 'exams',
    question: 'Can I retake an exam?',
    answer: 'This depends on your teacher\'s settings. Some exams allow multiple attempts, others are single-attempt only. Check the exam instructions or contact your teacher for more information.'
  },
  {
    category: 'exams',
    question: 'What happens if I lose internet connection during an exam?',
    answer: 'Your answers are automatically saved. If you lose connection, try to reconnect as soon as possible. The timer continues running, so you\'ll have the remaining time to complete the exam once reconnected.'
  },
  {
    category: 'results',
    question: 'Where can I see my exam results?',
    answer: 'You can view all your exam results on the "Results" page. You\'ll see your scores, percentages, and grades for each completed exam. Click "View" on any result to see detailed breakdown.'
  },
  {
    category: 'results',
    question: 'How are grades calculated?',
    answer: 'Grades are calculated as: A (80-100%), B (70-79%), C (60-69%), P (50-59%), F (0-49%). The passing mark is usually 50%, but some exams may have different requirements.'
  },
  {
    category: 'assignments',
    question: 'How do I submit an assignment?',
    answer: 'Go to the Assignments page, find the assignment you want to submit, click "Submit", and upload your file. Accepted formats: PDF, DOC, DOCX, TXT, JPG, PNG. Maximum file size: 10MB.'
  },
  {
    category: 'assignments',
    question: 'Can I submit an assignment after the deadline?',
    answer: 'Late submissions may be accepted depending on your teacher\'s settings, but they might be marked as late or receive reduced marks. It\'s best to submit before the due date.'
  },
  {
    category: 'account',
    question: 'How do I change my password?',
    answer: 'You can change your password in Settings → Account if you know your current password. If you\'ve forgotten your password, please submit a support ticket or contact the ICT Support Center for assistance.'
  },
  {
    category: 'account',
    question: 'I forgot my password. What should I do?',
    answer: 'For security reasons, password resets are handled by our support team. Please submit a support ticket with the category "Account Issue" or contact the ICT Support Center directly. You\'ll need to verify your identity.'
  },
  {
    category: 'account',
    question: 'How do I update my profile photo?',
    answer: 'Go to your Profile page and click the camera icon on your avatar to upload a new photo. Accepted formats: JPG, PNG, GIF. Maximum file size: 5MB.'
  },
  {
    category: 'technical',
    question: 'The page is not loading properly. What should I do?',
    answer: 'Try these steps: 1) Refresh the page 2) Clear your browser cache 3) Try using Google Chrome 4) Check your internet connection 5) Disable browser extensions temporarily.'
  },
  {
    category: 'technical',
    question: 'Can I use the portal on my mobile device?',
    answer: 'Yes! Vincollins Portal is fully responsive and works on smartphones and tablets. You can take exams and access all features from your mobile device.'
  }
]

const categories = [
  { id: 'all', label: 'All FAQs', icon: HelpCircle },
  { id: 'exams', label: 'Exams', icon: FileText },
  { id: 'results', label: 'Results', icon: Award },
  { id: 'assignments', label: 'Assignments', icon: BookOpen },
  { id: 'account', label: 'Account', icon: User },
  { id: 'technical', label: 'Technical', icon: Sparkles }
]

const guides = [
  { id: 1, title: 'Getting Started with Vincollins', description: 'Learn the basics of navigating the student portal', readTime: '5 min' },
  { id: 2, title: 'How to Take Your First Exam', description: 'Step-by-step guide to taking CBT exams', readTime: '8 min' },
  { id: 3, title: 'Understanding Your Results', description: 'Learn how to interpret your exam scores and grades', readTime: '4 min' },
  { id: 4, title: 'Submitting Assignments', description: 'Complete guide to submitting assignments correctly', readTime: '6 min' },
  { id: 5, title: 'Managing Your Student Profile', description: 'Update your information and settings', readTime: '3 min' },
  { id: 6, title: 'Mobile App Guide', description: 'Using Vincollins on your mobile device', readTime: '5 min' }
]

// Chat Bot Knowledge Base
const chatResponses: Record<string, string> = {
  'hello': 'Hello! How can I help you today? You can ask me about exams, assignments, results, account issues, or technical problems.',
  'hi': 'Hi there! What can I assist you with today?',
  'hey': 'Hey! How can I help you?',
  'good morning': 'Good morning! How can I assist you today?',
  'good afternoon': 'Good afternoon! What can I help you with?',
  'good evening': 'Good evening! How may I assist you?',
  'exam': 'You can find all available exams on the "My Exams" page. Click "Start Exam" to begin. Make sure you have a stable internet connection!',
  'take exam': 'Go to the "My Exams" page from your dashboard or sidebar. You\'ll see a list of available exams. Click "Start Exam" on any exam to begin.',
  'exam score': 'After submitting an objective exam, you\'ll see your score immediately. For exams with theory questions, wait for your teacher to grade them.',
  'retake exam': 'This depends on your teacher\'s settings. Some exams allow multiple attempts, others are single-attempt only. Check the exam instructions.',
  'exam time': 'Each exam has a specific time limit shown on the exam card. The timer starts when you click "Start Exam".',
  'result': 'You can view all your exam results on the "Results" page. You\'ll see your scores, percentages, and grades for each completed exam.',
  'grade': 'Grades are calculated as: A (80-100%), B (70-79%), C (60-69%), P (50-59%), F (0-49%).',
  'pass mark': 'The passing mark is usually 50%, but some exams may have different requirements set by your teacher.',
  'assignment': 'Assignments are available on the "Assignments" page. You can view details, download files, and submit your work before the due date.',
  'submit assignment': 'Go to Assignments, find the assignment, click "Submit", and upload your file (PDF, DOC, DOCX, or images). Max size: 10MB.',
  'assignment deadline': 'Assignment deadlines are shown on each assignment card. Submit before the due date to avoid penalties.',
  'password': 'To change your password, go to Settings → Account. You\'ll need your current password. If you\'ve forgotten your password, please contact support.',
  'forgot password': 'For security reasons, password resets are handled by our support team. Please submit a support ticket with category "Account Issue" or contact the ICT Support Center.',
  'reset password': 'Password resets must be done through our support team for security verification. Contact support@vincollins.edu.ng or visit the ICT Support Center.',
  'change password': 'You can change your password in Settings → Account if you know your current one. For forgotten passwords, contact support.',
  'profile photo': 'Go to your Profile page and click the camera icon on your avatar to upload a new photo (JPG, PNG, GIF - max 5MB).',
  'update profile': 'You can update your profile information on the Profile page. Click "Edit Profile" to make changes.',
  'not loading': 'Try: 1) Refresh the page 2) Clear browser cache 3) Try Chrome browser 4) Check internet connection.',
  'browser': 'Vincollins Portal works best on Google Chrome, Firefox, Edge, and Safari. Make sure your browser is up to date.',
  'mobile': 'Yes! The portal works on smartphones and tablets. You can take exams and access all features from your mobile device.',
  'internet': 'A stable internet connection is required, especially during exams. Your answers are auto-saved if connection drops.',
  'contact teacher': 'You can find teacher contact information in the "Courses" section. Click on a subject to see the teacher\'s details.',
  'support': 'You can reach support at support@vincollins.edu.ng or call +234 800 123 4567 during business hours (Mon-Fri, 8am-4pm).',
  'help': 'I\'m here to help! Ask me about exams, results, assignments, or technical issues. For password resets and account issues, please submit a support ticket.',
  'account locked': 'If your account is locked, please contact the ICT Support Center or submit a support ticket for assistance.',
  'vin id': 'Your VIN ID is your unique student identifier. If you\'ve forgotten it, check your admission letter or contact support.',
  'default': 'I\'m not sure about that. You can:\n• Search the FAQ above\n• Contact support at support@vincollins.edu.ng\n• Submit a support ticket\n• Call +234 800 123 4567\n• Visit the ICT Support Center'
}

const quickReplies = [
  'How do I take an exam?',
  'Where are my results?',
  'How to submit assignment?',
  'I forgot my password',
  'Contact support',
  'Technical issue'
]

interface ChatMessage {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

export default function StudentHelpPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [selectedGuide, setSelectedGuide] = useState<number | null>(null)
  
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: '👋 Hello! I\'m the Vincollins Assistant. I can help you with questions about exams, assignments, results, and more. For password resets and account issues, please contact our support team. What would you like to know?',
      sender: 'bot',
      timestamp: new Date()
    }
  ])
  const [chatInput, setChatInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [hasNewMessage, setHasNewMessage] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'up' | 'down'>>({})
  
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: '',
    message: '',
    priority: 'normal'
  })

  const getInitials = (name?: string): string => {
    if (!name) return 'S'
    const parts = name.split(' ')
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].slice(0, 2).toUpperCase()
  }

const formatProfileForHeader = (profile: StudentProfile | null) => {
    if (!profile) return undefined
    return {
      id: profile.id,
      name: profile.full_name,
      firstName: profile.full_name?.split(' ')[0] || 'Student',  // ✅ ADD THIS
      email: profile.email,
      role: 'student' as const,
      avatar: profile.photo_url || undefined,
      isAuthenticated: true
    }
  }

  const loadProfile = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/portal')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()

      if (profileData) {
        setProfile({
          id: profileData.id,
          full_name: profileData.full_name || 'Student',
          email: profileData.email || session.user.email || '',
          class: profileData.class || 'Not Assigned',
          department: profileData.department || 'General',
          vin_id: profileData.vin_id,
          photo_url: profileData.photo_url
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: 'local' })
    toast.success('Logged out successfully')
    router.push('/portal')
  }

  const handleSubmitTicket = async () => {
    if (!ticketForm.subject || !ticketForm.category || !ticketForm.message) {
      toast.error('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('support_tickets')
        .insert({
          student_id: profile?.id,
          student_name: profile?.full_name,
          student_email: profile?.email,
          student_class: profile?.class,
          subject: ticketForm.subject,
          category: ticketForm.category,
          message: ticketForm.message,
          priority: ticketForm.priority,
          status: 'open',
          created_at: new Date().toISOString()
        })

      if (error) throw error

      toast.success('Support ticket submitted successfully! We\'ll get back to you soon.')
      setTicketForm({ subject: '', category: '', message: '', priority: 'normal' })
    } catch (error) {
      console.error('Error submitting ticket:', error)
      toast.error('Failed to submit ticket. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredFaqs = faqData.filter(faq => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory
    const matchesSearch = !searchQuery || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const getBotResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase().trim()
    
    for (const [keyword, response] of Object.entries(chatResponses)) {
      if (lowerMessage.includes(keyword)) {
        return response
      }
    }
    
    if (lowerMessage.includes('exam') && lowerMessage.includes('start')) {
      return 'To start an exam, go to the "My Exams" page and click "Start Exam" on any available exam. Make sure you\'re ready before starting!'
    }
    
    if (lowerMessage.includes('result') || lowerMessage.includes('score')) {
      return 'You can view all your results on the "Results" page. Each result shows your score, percentage, and grade.'
    }
    
    if (lowerMessage.includes('thank')) {
      return 'You\'re welcome! 😊 Is there anything else I can help you with?'
    }
    
    if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye')) {
      return 'Goodbye! Feel free to come back if you need more help. Have a great day! 👋'
    }
    
    return chatResponses.default
  }

  const handleSendMessage = () => {
    if (!chatInput.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: chatInput,
      sender: 'user',
      timestamp: new Date()
    }
    
    setChatMessages(prev => [...prev, userMessage])
    setChatInput('')
    setIsTyping(true)
    setHasNewMessage(true)
    
    setTimeout(() => {
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: getBotResponse(userMessage.text),
        sender: 'bot',
        timestamp: new Date()
      }
      
      setChatMessages(prev => [...prev, botResponse])
      setIsTyping(false)
    }, 1000 + Math.random() * 1000)
  }

  const handleQuickReply = (reply: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: reply,
      sender: 'user',
      timestamp: new Date()
    }
    
    setChatMessages(prev => [...prev, userMessage])
    setIsTyping(true)
    
    setTimeout(() => {
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: getBotResponse(reply),
        sender: 'bot',
        timestamp: new Date()
      }
      
      setChatMessages(prev => [...prev, botResponse])
      setIsTyping(false)
    }, 1000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleChatFeedback = (messageId: string, type: 'up' | 'down') => {
    setFeedbackGiven(prev => ({ ...prev, [messageId]: type }))
    toast.success('Thank you for your feedback!')
  }

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen)
    setIsMinimized(false)
    setHasNewMessage(false)
  }

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <Header onLogout={handleLogout} />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mx-auto" />
            <p className="mt-4 text-slate-600 text-sm">Loading help center...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col">
      <Header user={formatProfileForHeader(profile)} onLogout={handleLogout} />
      
      <div className="flex flex-1">
        <div className="hidden lg:block">
          <StudentSidebar 
            profile={profile}
            onLogout={handleLogout}
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            activeTab="help"
            setActiveTab={() => {}}
          />
        </div>

        <div className={cn(
          "flex-1 transition-all duration-300 w-full",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
        )}>
          <main className="pt-20 sm:pt-24 lg:pt-28 pb-20 sm:pb-12 px-3 sm:px-4 md:px-6 lg:px-8">
            <div className="container mx-auto max-w-6xl">
              
              {/* Breadcrumb */}
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 md:mb-6 flex items-center justify-between flex-wrap gap-2"
              >
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Link href="/student" className="hover:text-primary flex items-center gap-1">
                    <Home className="h-3.5 w-3.5" />
                    <span className="hidden xs:inline">Dashboard</span>
                  </Link>
                  <ChevronRight className="h-3.5 w-3.5 hidden xs:block" />
                  <span className="text-foreground font-medium">Help & Support</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => router.push('/student')} className="h-8 text-xs">
                  <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                  Back
                </Button>
              </motion.div>

              {/* Page Header */}
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 md:mb-8"
              >
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Help & Support Center</h1>
                <p className="text-muted-foreground mt-1.5 sm:mt-2 text-xs sm:text-sm md:text-base">Find answers to common questions or contact our support team</p>
              </motion.div>

              {/* Search Bar */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-4 md:mb-6 lg:mb-8"
              >
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                  <Input
                    placeholder="Search for answers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 sm:pl-10 h-10 sm:h-12 text-sm sm:text-base bg-white shadow-sm"
                  />
                </div>
              </motion.div>

              {/* Main Tabs */}
              <Tabs defaultValue="faq" className="space-y-4 sm:space-y-6">
                <TabsList className="bg-white p-1 rounded-xl shadow-sm border w-full overflow-x-auto flex-nowrap">
                  <TabsTrigger value="faq" className="rounded-lg text-xs sm:text-sm whitespace-nowrap">FAQ</TabsTrigger>
                  <TabsTrigger value="guides" className="rounded-lg text-xs sm:text-sm whitespace-nowrap">Quick Guides</TabsTrigger>
                  <TabsTrigger value="contact" className="rounded-lg text-xs sm:text-sm whitespace-nowrap">Contact Support</TabsTrigger>
                </TabsList>

                {/* FAQ Tab */}
                <TabsContent value="faq" className="space-y-4 sm:space-y-6">
                  <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 sm:flex-wrap">
                    {categories.map(cat => {
                      const Icon = cat.icon
                      return (
                        <Badge
                          key={cat.id}
                          variant={activeCategory === cat.id ? 'default' : 'outline'}
                          className={cn(
                            "cursor-pointer hover:bg-primary/10 transition-all px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm whitespace-nowrap shrink-0",
                            activeCategory === cat.id && "bg-primary text-white"
                          )}
                          onClick={() => setActiveCategory(cat.id)}
                        >
                          <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5" />
                          <span>{cat.label}</span>
                        </Badge>
                      )
                    })}
                  </div>

                  <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="p-4 sm:p-6">
                      {filteredFaqs.length === 0 ? (
                        <div className="text-center py-8 sm:py-12">
                          <HelpCircle className="h-10 w-10 sm:h-12 sm:w-12 text-slate-400 mx-auto mb-3 sm:mb-4" />
                          <p className="text-slate-500 text-sm sm:text-base">No FAQs found matching your search.</p>
                          <p className="text-xs text-slate-400 mt-1">Try different keywords or browse all categories.</p>
                        </div>
                      ) : (
                        <div className="space-y-2 sm:space-y-3">
                          {filteredFaqs.map((faq, index) => (
                            <div key={index} className="border border-slate-200 rounded-lg overflow-hidden">
                              <details className="group">
                                <summary className="flex items-center justify-between p-3 sm:p-4 cursor-pointer hover:bg-slate-50 list-none">
                                  <span className="font-medium text-gray-900 text-sm sm:text-base pr-4">{faq.question}</span>
                                  <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-90 shrink-0" />
                                </summary>
                                <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0 border-t border-slate-200 bg-slate-50">
                                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{faq.answer}</p>
                                </div>
                              </details>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Guides Tab */}
                <TabsContent value="guides">
                  <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {guides.map((guide) => (
                      <Card 
                        key={guide.id} 
                        className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow cursor-pointer" 
                        onClick={() => setSelectedGuide(guide.id)}
                      >
                        <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6">
                          <CardTitle className="text-base sm:text-lg">{guide.title}</CardTitle>
                          <CardDescription className="text-xs sm:text-sm">{guide.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="px-4 sm:px-6 pb-4">
                          <div className="flex items-center text-xs sm:text-sm text-slate-500">
                            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                            {guide.readTime} read
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* Contact Support Tab */}
                <TabsContent value="contact">
                  <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
                    <div className="lg:col-span-1 space-y-3 sm:space-y-4">
                      <Card className="border-0 shadow-sm bg-white">
                        <CardHeader className="pb-2 px-4 sm:px-6">
                          <CardTitle className="text-base sm:text-lg">Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6 pb-4">
                          <div className="flex items-start gap-2 sm:gap-3">
                            <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 mt-0.5 shrink-0" />
                            <div>
                              <p className="font-medium text-sm sm:text-base">Phone Support</p>
                              <p className="text-xs sm:text-sm text-slate-600">+234 800 123 4567</p>
                              <p className="text-[10px] sm:text-xs text-slate-500">Mon-Fri, 8am-4pm</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2 sm:gap-3">
                            <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 mt-0.5 shrink-0" />
                            <div>
                              <p className="font-medium text-sm sm:text-base">Email Support</p>
                              <p className="text-xs sm:text-sm text-slate-600 break-all">support@vincollins.edu.ng</p>
                              <p className="text-[10px] sm:text-xs text-slate-500">Response within 24h</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2 sm:gap-3">
                            <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 mt-0.5 shrink-0" />
                            <div>
                              <p className="font-medium text-sm sm:text-base">Visit Us</p>
                              <p className="text-xs sm:text-sm text-slate-600">ICT Support Center</p>
                              <p className="text-[10px] sm:text-xs text-slate-500">Main Campus Building</p>
                            </div>
                          </div>
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
                            <div className="flex items-start gap-2">
                              <Shield className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-xs font-medium text-amber-800">Password Resets</p>
                                <p className="text-[10px] sm:text-xs text-amber-700 mt-0.5">
                                  Password resets require identity verification. Visit the ICT Support Center or submit a ticket.
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="lg:col-span-2">
                      <Card className="border-0 shadow-sm bg-white">
                        <CardHeader className="pb-3 px-4 sm:px-6">
                          <CardTitle className="text-base sm:text-lg">Submit a Support Ticket</CardTitle>
                          <CardDescription className="text-xs sm:text-sm">Fill out the form below and we'll get back to you soon</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
                          <div>
                            <Label htmlFor="subject" className="text-xs sm:text-sm">Subject *</Label>
                            <Input
                              id="subject"
                              value={ticketForm.subject}
                              onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                              placeholder="Brief description of your issue"
                              className="mt-1 text-sm"
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                              <Label htmlFor="category" className="text-xs sm:text-sm">Category *</Label>
                              <Select value={ticketForm.category} onValueChange={(v) => setTicketForm({ ...ticketForm, category: v })}>
                                <SelectTrigger className="mt-1 text-sm">
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="technical">Technical Issue</SelectItem>
                                  <SelectItem value="exam">Exam Related</SelectItem>
                                  <SelectItem value="assignment">Assignment Help</SelectItem>
                                  <SelectItem value="account">Account Issue</SelectItem>
                                  <SelectItem value="password">Password Reset</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="priority" className="text-xs sm:text-sm">Priority</Label>
                              <Select value={ticketForm.priority} onValueChange={(v) => setTicketForm({ ...ticketForm, priority: v })}>
                                <SelectTrigger className="mt-1 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="low">Low</SelectItem>
                                  <SelectItem value="normal">Normal</SelectItem>
                                  <SelectItem value="high">High</SelectItem>
                                  <SelectItem value="urgent">Urgent</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="message" className="text-xs sm:text-sm">Message *</Label>
                            <Textarea
                              id="message"
                              value={ticketForm.message}
                              onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                              placeholder="Describe your issue in detail..."
                              rows={5}
                              className="mt-1 text-sm resize-none"
                            />
                          </div>
                          <Button 
                            onClick={handleSubmitTicket} 
                            disabled={submitting}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-sm sm:text-base h-10 sm:h-11"
                          >
                            {submitting ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="mr-2 h-4 w-4" />
                            )}
                            Submit Ticket
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>

      {/* Chat Bot Widget */}
      <>
        <AnimatePresence>
          {isChatOpen && !isMinimized && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className={cn(
                "fixed z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden",
                "top-20 sm:top-24 md:top-28",
                "right-3 sm:right-4 md:right-6",
                "w-[calc(100vw-1.5rem)] sm:w-[380px]",
                "max-w-[380px]",
                "max-h-[calc(100vh-120px)] sm:max-h-[calc(100vh-140px)]"
              )}
            >
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-3 sm:p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="relative">
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white/20 flex items-center justify-center">
                        <Bot className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 sm:h-3 sm:w-3 bg-green-400 rounded-full border-2 border-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base flex items-center gap-1 sm:gap-2">
                        Vincollins Assistant
                        <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-300" />
                      </h3>
                      <p className="text-[10px] sm:text-xs text-emerald-100">Online • Usually replies instantly</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={toggleMinimize} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                      <Minimize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                    <button onClick={toggleChat} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                      <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="h-[300px] sm:h-[350px] md:h-[400px] max-h-[calc(100vh-320px)] overflow-y-auto p-3 sm:p-4 bg-slate-50">
                <div className="space-y-3 sm:space-y-4">
                  {chatMessages.map((message) => (
                    <div key={message.id}>
                      <div className={cn(
                        "flex items-start gap-2",
                        message.sender === 'user' && "flex-row-reverse"
                      )}>
                        {message.sender === 'bot' && (
                          <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                            <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600" />
                          </div>
                        )}
                        <div className={cn(
                          "max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5",
                          message.sender === 'user'
                            ? "bg-emerald-600 text-white"
                            : "bg-white border border-slate-200 text-slate-700"
                        )}>
                          <p className="text-xs sm:text-sm whitespace-pre-wrap">{message.text}</p>
                          <span className="text-[9px] sm:text-[10px] opacity-60 mt-1 block">
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      
                      {message.sender === 'bot' && message.id !== '1' && (
                        <div className="flex items-center gap-2 ml-9 sm:ml-10 mt-1">
                          <button
                            onClick={() => handleChatFeedback(message.id, 'up')}
                            className={cn("p-1 rounded hover:bg-slate-200 transition-colors", feedbackGiven[message.id] === 'up' && "text-green-600")}
                          >
                            <ThumbsUp className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          </button>
                          <button
                            onClick={() => handleChatFeedback(message.id, 'down')}
                            className={cn("p-1 rounded hover:bg-slate-200 transition-colors", feedbackGiven[message.id] === 'down' && "text-red-600")}
                          >
                            <ThumbsDown className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex items-start gap-2">
                      <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600" />
                      </div>
                      <div className="bg-white border border-slate-200 rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3">
                        <div className="flex gap-1">
                          <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={chatEndRef} />
                </div>
              </div>

              <div className="p-2 sm:p-3 border-t border-slate-200 bg-white">
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {quickReplies.slice(0, 4).map((reply) => (
                    <Badge
                      key={reply}
                      variant="outline"
                      className="cursor-pointer hover:bg-emerald-50 hover:border-emerald-300 transition-colors text-[10px] sm:text-xs py-0.5 sm:py-1"
                      onClick={() => handleQuickReply(reply)}
                    >
                      {reply}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="p-3 sm:p-4 border-t border-slate-200 bg-white">
                <div className="flex items-center gap-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    className="flex-1 bg-slate-50 border-slate-200 text-sm h-9 sm:h-10"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim()}
                    size="icon"
                    className="bg-emerald-600 hover:bg-emerald-700 shrink-0 h-9 w-9 sm:h-10 sm:w-10"
                  >
                    <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Minimized Chat */}
        <AnimatePresence>
          {isChatOpen && isMinimized && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed z-50 top-20 sm:top-24 right-3 sm:right-4 md:right-6 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full shadow-lg py-2 px-4 cursor-pointer"
              onClick={toggleMinimize}
            >
              <div className="flex items-center gap-2 sm:gap-3 text-white">
                <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="font-medium text-sm">Chat with us</span>
                <Maximize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Button */}
        {!isChatOpen && (
          <motion.button
            onClick={toggleChat}
            className="fixed z-50 bottom-4 right-4 sm:bottom-6 sm:right-6 p-3 sm:p-4 rounded-full shadow-lg text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
            {hasNewMessage && (
              <span className="absolute -top-1 -right-1 h-3.5 w-3.5 sm:h-4 sm:w-4 bg-red-500 rounded-full border-2 border-white" />
            )}
          </motion.button>
        )}
      </>
    </div>
  )
}