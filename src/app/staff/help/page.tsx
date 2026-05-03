// app/staff/help/page.tsx - STAFF HELP & SUPPORT PAGE
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { StaffSidebar } from '@/components/staff/StaffSidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { 
  HelpCircle, BookOpen, MessageCircle, Phone, Mail, 
  Video, FileText, Search, ArrowRight, ChevronRight, Home,
  Loader2, Send, CheckCircle, AlertCircle, ExternalLink,
  GraduationCap, MonitorPlay, FileText as FileIcon, Users,
  Calculator, Clock, Shield
} from 'lucide-react'
import Link from 'next/link'

// ============================================
// TYPES
// ============================================
interface StaffProfile {
  id: string
  full_name: string
  email: string
  role?: string
  photo_url?: string
}

interface FAQItem {
  question: string
  answer: string
  category: string
}

// ============================================
// FAQ DATA
// ============================================
const faqData: FAQItem[] = [
  {
    category: 'exams',
    question: 'How do I create a new exam?',
    answer: 'Navigate to the Exams section from the sidebar, click the "Create Exam" button. Fill in the exam details including title, subject, class, duration, and questions. You can add multiple choice, theory, or mixed questions. Once done, publish the exam for students to access.'
  },
  {
    category: 'exams',
    question: 'How do I grade theory submissions?',
    answer: 'Go to Exams → click on an exam → Submissions tab. You\'ll see pending theory submissions highlighted. Click on each student\'s submission to review their answers and assign scores. Save your grades when done.'
  },
  {
    category: 'exams',
    question: 'Can I edit an exam after publishing?',
    answer: 'You can edit exam details like title and description, but you cannot modify questions after students have started taking the exam. It\'s recommended to thoroughly review your exam before publishing.'
  },
  {
    category: 'students',
    question: 'How do I view student performance?',
    answer: 'Go to the Students section to see all enrolled students. Click on any student to view their detailed performance, exam history, scores, and progress reports. You can also filter by class and subject.'
  },
  {
    category: 'students',
    question: 'How do I generate report cards?',
    answer: 'Navigate to Report Cards from the sidebar or quick actions. Select the class, term, and session. The system will automatically compile student scores. Review and generate report cards individually or in bulk.'
  },
  {
    category: 'assignments',
    question: 'How do I create and manage assignments?',
    answer: 'Click on Assignments in the sidebar, then "Create Assignment". Add title, description, subject, class, due date, and attachments if needed. Students can submit their work through the portal, and you can review and grade submissions.'
  },
  {
    category: 'notes',
    question: 'How do I share study materials with students?',
    answer: 'Use the Notes section to upload and share study materials. Click "Add Notes", provide a title, subject, class, and upload your file or write content directly. Published notes become available to students immediately.'
  },
  {
    category: 'account',
    question: 'How do I update my profile information?',
    answer: 'Go to My Profile from the sidebar. Click "Edit Profile" to update your name, phone, address, qualifications, and upload a profile photo. Don\'t forget to save your changes.'
  },
  {
    category: 'account',
    question: 'What should I do if I forget my password?',
    answer: 'Contact the school administrator or IT support team. They can reset your password. For security reasons, password resets are handled by authorized personnel only.'
  },
  {
    category: 'technical',
    question: 'The page is not loading properly. What should I do?',
    answer: 'First, try refreshing the page. If the issue persists, clear your browser cache and cookies. Check your internet connection. If problems continue, contact technical support.'
  },
  {
    category: 'technical',
    question: 'Which browsers are supported?',
    answer: 'The portal works best on modern browsers like Chrome, Firefox, Safari, and Edge. Make sure your browser is updated to the latest version for the best experience.'
  },
]

// ============================================
// HELPER COMPONENTS
// ============================================
function HelpSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <Skeleton className="h-10 w-48 rounded-lg" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function StaffHelpPage() {
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<StaffProfile | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('faq')
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredFAQs, setFilteredFAQs] = useState<FAQItem[]>(faqData)
  
  // Contact form state
  const [contactSubject, setContactSubject] = useState('')
  const [contactMessage, setContactMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // ============================================
  // LOAD PROFILE
  // ============================================
  const loadProfile = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/portal')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, photo_url')
        .eq('id', session.user.id)
        .single()

      if (profileData) {
        setProfile(profileData as StaffProfile)
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

  // ============================================
  // SEARCH & FILTER FAQS
  // ============================================
  useEffect(() => {
    let filtered = faqData
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        faq => 
          faq.question.toLowerCase().includes(query) || 
          faq.answer.toLowerCase().includes(query)
      )
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(faq => faq.category === selectedCategory)
    }
    
    setFilteredFAQs(filtered)
  }, [searchQuery, selectedCategory])

  // ============================================
  // HANDLERS
  // ============================================
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/portal')
  }

  const handleSendMessage = async () => {
    if (!contactSubject.trim() || !contactMessage.trim()) {
      toast.error('Please fill in both subject and message fields')
      return
    }

    setSending(true)
    
    try {
      // Save support message to database (optional)
      const { error } = await supabase
        .from('support_messages')
        .insert({
          user_id: profile?.id,
          user_name: profile?.full_name,
          user_email: profile?.email,
          subject: contactSubject.trim(),
          message: contactMessage.trim(),
          created_at: new Date().toISOString(),
        })

      if (error) throw error

      toast.success('Message sent successfully! We\'ll get back to you soon.')
      setSent(true)
      setContactSubject('')
      setContactMessage('')
      
      setTimeout(() => setSent(false), 3000)
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const formatProfileForHeader = () => {
    if (!profile) return undefined
    return {
      id: profile.id,
      name: profile.full_name,
      email: profile.email,
      role: 'teacher' as const,
      avatar: profile.photo_url || undefined,
      isAuthenticated: true
    }
  }

  const categories = [
    { value: 'all', label: 'All Topics' },
    { value: 'exams', label: 'Exams' },
    { value: 'students', label: 'Students' },
    { value: 'assignments', label: 'Assignments' },
    { value: 'notes', label: 'Notes' },
    { value: 'account', label: 'Account' },
    { value: 'technical', label: 'Technical' },
  ]

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col">
        <Header onLogout={handleLogout} />
        <div className="flex flex-1">
          <div className="hidden lg:block w-72 shrink-0" />
          <div className="flex-1">
            <main className="pt-16 sm:pt-20 lg:pt-24 pb-8 sm:pb-12">
              <div className="w-full max-w-screen-xl mx-auto px-3 sm:px-4 md:px-5 lg:px-6">
                <HelpSkeleton />
              </div>
            </main>
          </div>
        </div>
      </div>
    )
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col overflow-x-hidden">
      <Header user={formatProfileForHeader()} onLogout={handleLogout} />
      
      <div className="flex flex-1">
        <StaffSidebar 
          profile={profile}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeTab="help"
          setActiveTab={() => {}}
        />

        <div className={cn(
          "flex-1 transition-all duration-300 overflow-x-hidden min-w-0",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
        )}>
          <main className="pt-16 sm:pt-20 lg:pt-24 pb-8 sm:pb-12">
            <div className="w-full max-w-screen-xl mx-auto px-3 sm:px-4 md:px-5 lg:px-6">
              
              {/* Breadcrumb */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3 sm:mb-4 md:mb-6 flex flex-wrap items-center justify-between gap-2 sm:gap-3"
              >
                <div className="flex items-center gap-1 sm:gap-2 text-[11px] sm:text-xs md:text-sm text-muted-foreground flex-wrap">
                  <Link href="/staff" className="hover:text-primary flex items-center gap-1 transition-colors">
                    <Home className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    <span className="hidden xs:inline">Dashboard</span>
                  </Link>
                  <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                  <span className="text-foreground font-medium truncate">Help & Support</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => router.push('/staff')} 
                  className="h-7 sm:h-8 md:h-9 text-[11px] sm:text-xs md:text-sm flex-shrink-0"
                >
                  <ArrowRight className="mr-1 sm:mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5 rotate-180" />
                  Back
                </Button>
              </motion.div>

              {/* Page Title */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3 sm:mb-4 md:mb-6"
              >
                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-blue-600" />
                  Help & Support
                </h1>
                <p className="text-[11px] sm:text-xs md:text-sm text-slate-500 mt-0.5 sm:mt-1">
                  Find answers, guides, and get help when you need it
                </p>
              </motion.div>

              {/* Quick Help Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6"
              >
                <QuickHelpCard icon={BookOpen} title="Guides" description="Step-by-step tutorials" color="bg-blue-50 text-blue-600" />
                <QuickHelpCard icon={Video} title="Videos" description="Watch tutorials" color="bg-purple-50 text-purple-600" />
                <QuickHelpCard icon={MessageCircle} title="Live Chat" description="Talk to support" color="bg-emerald-50 text-emerald-600" />
                <QuickHelpCard icon={Phone} title="Call Us" description="+234 912 1155 554" color="bg-amber-50 text-amber-600" />
              </motion.div>

              {/* Main Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3 sm:space-y-4 md:space-y-6">
                  <TabsList className="grid w-full grid-cols-3 max-w-[300px] sm:max-w-[400px] bg-slate-100 p-1 rounded-xl">
                    <TabsTrigger value="faq" className="data-[state=active]:bg-white rounded-lg text-[10px] sm:text-xs md:text-sm py-1.5 sm:py-2">
                      <HelpCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5" />
                      FAQ
                    </TabsTrigger>
                    <TabsTrigger value="guides" className="data-[state=active]:bg-white rounded-lg text-[10px] sm:text-xs md:text-sm py-1.5 sm:py-2">
                      <BookOpen className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5" />
                      Guides
                    </TabsTrigger>
                    <TabsTrigger value="contact" className="data-[state=active]:bg-white rounded-lg text-[10px] sm:text-xs md:text-sm py-1.5 sm:py-2">
                      <MessageCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5" />
                      Contact
                    </TabsTrigger>
                  </TabsList>

                  {/* ============================================ */}
                  {/* FAQ TAB */}
                  {/* ============================================ */}
                  <TabsContent value="faq" className="space-y-3 sm:space-y-4">
                    {/* Search */}
                    <Card className="border-0 shadow-lg">
                      <CardContent className="p-3 sm:p-4 md:p-6">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                              placeholder="Search FAQs..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-10 h-9 sm:h-10 text-xs sm:text-sm"
                            />
                          </div>
                          <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="h-9 sm:h-10 px-3 rounded-lg border border-slate-200 text-xs sm:text-sm bg-white"
                          >
                            {categories.map(cat => (
                              <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                          </select>
                        </div>
                      </CardContent>
                    </Card>

                    {/* FAQ List */}
                    <Card className="border-0 shadow-lg">
                      <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-4 md:px-6">
                        <CardTitle className="text-sm sm:text-base md:text-lg">
                          {filteredFAQs.length} FAQ{filteredFAQs.length !== 1 ? 's' : ''} Found
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
                        {filteredFAQs.length === 0 ? (
                          <div className="text-center py-8">
                            <Search className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-sm text-slate-500">No FAQs found matching your search</p>
                            <Button variant="link" onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }} className="text-xs mt-2">
                              Clear filters
                            </Button>
                          </div>
                        ) : (
                          <Accordion type="single" collapsible className="space-y-1">
                            {filteredFAQs.map((faq, index) => (
                              <AccordionItem key={index} value={`faq-${index}`} className="border rounded-lg px-3 sm:px-4">
                                <AccordionTrigger className="text-xs sm:text-sm font-medium hover:no-underline py-3">
                                  {faq.question}
                                </AccordionTrigger>
                                <AccordionContent className="text-[11px] sm:text-xs text-slate-600 pb-3">
                                  {faq.answer}
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* ============================================ */}
                  {/* GUIDES TAB */}
                  {/* ============================================ */}
                  <TabsContent value="guides" className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <GuideCard
                        icon={MonitorPlay}
                        title="Creating Exams"
                        description="Learn how to create and manage exams for your students"
                        color="text-blue-600"
                        bgColor="bg-blue-50"
                      />
                      <GuideCard
                        icon={Calculator}
                        title="Grading & Scoring"
                        description="How to grade submissions and manage CA scores"
                        color="text-emerald-600"
                        bgColor="bg-emerald-50"
                      />
                      <GuideCard
                        icon={Users}
                        title="Managing Students"
                        description="View student profiles, performance, and generate reports"
                        color="text-purple-600"
                        bgColor="bg-purple-50"
                      />
                      <GuideCard
                        icon={FileIcon}
                        title="Assignments & Notes"
                        description="Create assignments and share study materials"
                        color="text-amber-600"
                        bgColor="bg-amber-50"
                      />
                      <GuideCard
                        icon={Shield}
                        title="Account & Security"
                        description="Manage your profile, settings, and account security"
                        color="text-red-600"
                        bgColor="bg-red-50"
                      />
                      <GuideCard
                        icon={Clock}
                        title="Term & Session Management"
                        description="Understanding term progress and academic calendar"
                        color="text-indigo-600"
                        bgColor="bg-indigo-50"
                      />
                    </div>
                  </TabsContent>

                  {/* ============================================ */}
                  {/* CONTACT TAB */}
                  {/* ============================================ */}
                  <TabsContent value="contact" className="space-y-3 sm:space-y-4">
                    <Card className="border-0 shadow-lg">
                      <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-4 md:px-6">
                        <CardTitle className="text-sm sm:text-base md:text-lg">Send us a Message</CardTitle>
                        <CardDescription className="text-[10px] sm:text-xs md:text-sm">
                          Have a question or need help? We'll get back to you shortly.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
                        {sent ? (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-8"
                          >
                            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                            <h3 className="text-lg font-semibold text-slate-900">Message Sent!</h3>
                            <p className="text-sm text-slate-500 mt-1">We'll get back to you within 24 hours.</p>
                          </motion.div>
                        ) : (
                          <>
                            <div>
                              <label className="text-[11px] sm:text-xs md:text-sm font-medium mb-1.5 block">Subject</label>
                              <Input
                                placeholder="What do you need help with?"
                                value={contactSubject}
                                onChange={(e) => setContactSubject(e.target.value)}
                                className="h-9 sm:h-10 text-xs sm:text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] sm:text-xs md:text-sm font-medium mb-1.5 block">Message</label>
                              <Textarea
                                placeholder="Describe your issue or question..."
                                value={contactMessage}
                                onChange={(e) => setContactMessage(e.target.value)}
                                rows={5}
                                className="resize-none text-xs sm:text-sm"
                              />
                            </div>
                            <Button 
                              onClick={handleSendMessage} 
                              disabled={sending}
                              className="w-full bg-blue-600 hover:bg-blue-700 h-9 sm:h-10 text-xs sm:text-sm"
                            >
                              {sending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Send className="h-4 w-4 mr-2" />
                              )}
                              {sending ? 'Sending...' : 'Send Message'}
                            </Button>
                          </>
                        )}
                      </CardContent>
                    </Card>

                    {/* Contact Info */}
                    <Card className="border-0 shadow-lg">
                      <CardContent className="p-3 sm:p-4 md:p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-center">
                          <div className="p-3">
                            <Phone className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                            <p className="text-xs sm:text-sm font-medium">Phone</p>
                            <p className="text-[10px] sm:text-xs text-slate-500">+234 912 1155 554</p>
                          </div>
                          <div className="p-3">
                            <Mail className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                            <p className="text-xs sm:text-sm font-medium">Email</p>
                            <p className="text-[10px] sm:text-xs text-slate-500 break-all">vincollinscollege@gmail.com</p>
                          </div>
                          <div className="p-3">
                            <Clock className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                            <p className="text-xs sm:text-sm font-medium">Hours</p>
                            <p className="text-[10px] sm:text-xs text-slate-500">Mon-Fri, 8AM-4PM</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </motion.div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

// ============================================
// QUICK HELP CARD COMPONENT
// ============================================
function QuickHelpCard({ 
  icon: Icon, title, description, color 
}: { 
  icon: React.ElementType
  title: string
  description: string
  color: string
}) {
  return (
    <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer">
      <div className={cn("p-2 rounded-lg w-fit mb-2", color.split(' ')[0], color.split(' ')[1])}>
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>
      <h3 className="text-xs sm:text-sm font-semibold text-slate-900">{title}</h3>
      <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">{description}</p>
    </div>
  )
}

// ============================================
// GUIDE CARD COMPONENT
// ============================================
function GuideCard({ 
  icon: Icon, title, description, color, bgColor 
}: { 
  icon: React.ElementType
  title: string
  description: string
  color: string
  bgColor: string
}) {
  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer">
      <CardContent className="p-3 sm:p-4 md:p-5 flex items-start gap-3">
        <div className={cn("p-2 sm:p-2.5 rounded-lg shrink-0", bgColor)}>
          <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5", color)} />
        </div>
        <div>
          <h3 className="text-xs sm:text-sm font-semibold text-slate-900">{title}</h3>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">{description}</p>
          <Button variant="link" size="sm" className="p-0 h-auto text-[10px] sm:text-xs mt-1">
            Learn more <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}