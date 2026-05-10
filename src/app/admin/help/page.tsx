// app/admin/help/page.tsx - HELP & SUPPORT PAGE
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { 
  HelpCircle, BookOpen, Video, MessageSquare, Mail, Phone,
  FileText, ExternalLink, ChevronRight, Search, Sparkles,
  Shield, MonitorPlay, Users, GraduationCap, FileCheck,
  LifeBuoy, Clock
} from 'lucide-react'
import Link from 'next/link'

const helpCategories = [
  {
    title: 'Getting Started',
    icon: BookOpen,
    articles: [
      'How to navigate the admin dashboard',
      'Understanding the overview page',
      'Setting up your profile',
      'Managing notifications',
    ]
  },
  {
    title: 'Student Management',
    icon: GraduationCap,
    articles: [
      'Adding new students',
      'Editing student information',
      'Managing student classes',
      'Viewing student performance',
    ]
  },
  {
    title: 'Staff Management',
    icon: Users,
    articles: [
      'Adding teachers and staff',
      'Assigning subjects to teachers',
      'Managing staff permissions',
    ]
  },
  {
    title: 'Exam Management',
    icon: MonitorPlay,
    articles: [
      'Approving submitted exams',
      'Managing exam schedules',
      'Viewing exam results',
    ]
  },
  {
    title: 'Report Cards',
    icon: FileCheck,
    articles: [
      'Generating report cards',
      'Using the Broad Sheet',
      'Approving report cards',
      'Printing and exporting',
    ]
  },
]

const faqs = [
  { q: 'How do I reset a student password?', a: 'Go to Students → Click on student → Reset Password. A new VIN ID will be generated.' },
  { q: 'How do I approve exams?', a: 'Go to Exam Approvals → Review the exam → Click Approve or Reject.' },
  { q: 'How do I generate report cards?', a: 'Go to Broad Sheet → Select class, term, year → Approve submissions → Generate Report Cards.' },
  { q: 'How do I add a new teacher?', a: 'Go to Staff → Add Staff → Fill in the details → Submit.' },
]

export default function HelpSupportPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmitTicket = () => {
    if (!message.trim()) {
      toast.error('Please enter a message')
      return
    }
    setSubmitted(true)
    toast.success('Support ticket submitted! We will get back to you soon.')
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-slate-500" />
          Help & Support
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">Find answers or contact our support team</p>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search help articles..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-10 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Help Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {helpCategories.map((cat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="border-0 shadow-sm h-full hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center">
                    <cat.icon className="h-4 w-4 text-purple-600" />
                  </div>
                  <CardTitle className="text-sm">{cat.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {cat.articles.map((article, j) => (
                    <button key={j} className="w-full text-left text-xs text-slate-600 hover:text-purple-600 py-1.5 px-2 rounded hover:bg-purple-50 transition-colors flex items-center gap-2">
                      <FileText className="h-3 w-3 text-slate-300 shrink-0" />
                      <span className="line-clamp-1">{article}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* FAQs */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="p-3 bg-slate-50 rounded-lg">
              <p className="text-sm font-medium text-slate-800">{faq.q}</p>
              <p className="text-xs text-slate-500 mt-1">{faq.a}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Contact Support */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-purple-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <LifeBuoy className="h-4 w-4 text-purple-600" />
            Contact Support
          </CardTitle>
          <CardDescription className="text-xs">
            Need more help? Send us a message and we'll respond within 24 hours.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {submitted ? (
            <div className="text-center py-6">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Sparkles className="h-6 w-6 text-green-600" />
              </div>
              <p className="font-medium text-green-800">Ticket Submitted!</p>
              <p className="text-sm text-green-600 mt-1">We'll get back to you within 24 hours.</p>
            </div>
          ) : (
            <>
              <Textarea
                placeholder="Describe your issue or question..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={4}
                className="resize-none text-sm"
              />
              <Button onClick={handleSubmitTicket} className="bg-purple-600 hover:bg-purple-700">
                <MessageSquare className="h-4 w-4 mr-2" />
                Submit Ticket
              </Button>
            </>
          )}

          <div className="flex flex-wrap gap-4 pt-3 border-t">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Mail className="h-3.5 w-3.5" /> vincollinscollege@gmail.com
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Phone className="h-3.5 w-3.5" /> +234 912 1155 554
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock className="h-3.5 w-3.5" /> Mon-Fri: 8:00 AM - 4:00 PM
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}