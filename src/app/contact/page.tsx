/* eslint-disable @typescript-eslint/no-unused-vars */
// app/contact/page.tsx - WITH PROFESSIONAL HERO SECTION
'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { 
  Mail, Phone, MapPin, Clock, Send, CheckCircle, 
  KeyRound, AlertCircle, Home, ChevronRight, Facebook, Twitter, Instagram,
  MessageCircle, Headphones, Sparkles, ArrowRight, GraduationCap
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Dynamically import Header with SSR disabled
const Header = dynamic(() => import('@/components/layout/header').then(mod => ({ default: mod.Header })), {
  ssr: false,
  loading: () => <div className="h-16 bg-gradient-to-r from-[#0A2472] to-[#1e3a8a]" />
})

// Dynamically import WhatsAppWidget with SSR disabled
const WhatsAppWidget = dynamic(() => import('@/components/WhatsAppWidget').then(mod => ({ default: mod.WhatsAppWidget })), {
  ssr: false,
  loading: () => null
})

const inquiryTypes = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'admission', label: 'Admission Question' },
  { value: 'academic', label: 'Academic Programs' },
  { value: 'technical', label: 'Technical Support' },
  { value: 'billing', label: 'Billing/Payments' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'forgot_vin', label: '🔐 Forgot VIN ID' },
  { value: 'forgot_email', label: '📧 Forgot Email' },
  { value: 'forgot_both', label: '🔑 Forgot Login Details' },
  { value: 'other', label: 'Other' }
]

const classes = ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3', 'Staff']

const CONTACT_INFO = {
  address: '7/9, Lawani Street, off Ishaga Rd, Surulere, Lagos',
  phone: '+234 912 1155 554',
  phoneRaw: '+2349121155554',
  email: 'vincollinscollege@gmail.com',
  supportEmail: 'vincollinscollege@gmail.com',
  whatsapp: '+2349121155554',
  hours: {
    weekdays: 'Mon-Fri: 8:00 AM - 4:00 PM',
    saturday: 'Sat: 9:00 AM - 12:00 PM',
    sunday: 'Sun: Closed'
  }
}

const SOCIAL_LINKS = {
  facebook: 'https://facebook.com/vincollins',
  twitter: 'https://twitter.com/vincollins',
  instagram: 'https://instagram.com/vincollins',
}

export default function ContactPage() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [ticketId, setTicketId] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    vin_id: '',
    student_class: '',
    admission_year: '',
    subject: '',
    message: '',
    inquiry_type: '',
    is_urgent: false
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  const isCredentialRecovery = ['forgot_vin', 'forgot_email', 'forgot_both'].includes(formData.inquiry_type)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.inquiry_type) {
      toast.error('Please fill in all required fields')
      return
    }
    
    if (isCredentialRecovery && !formData.student_class) {
      toast.error('Please select your class for identity verification')
      return
    }
    
    setLoading(true)
    
    try {
      const response = await fetch('/api/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit request')
      }
      
      setTicketId(data.ticket_id || `TKT-${Date.now().toString().slice(-6)}`)
      setSubmitted(true)
      toast.success('Request submitted successfully!')
      
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const getSuccessMessage = () => {
    if (isCredentialRecovery) {
      return {
        title: 'Recovery Request Submitted',
        message: 'Your credential recovery request has been received. Our admin team will verify your identity and send your login details to your registered email within 24-48 hours.'
      }
    }
    return {
      title: 'Thank You!',
      message: 'Your message has been sent. We\'ll get back to you within 24-48 hours.'
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-slate-950 dark:to-slate-900">
        <div className="h-16 bg-gradient-to-r from-[#0A2472] to-[#1e3a8a]" />
        <div className="container max-w-6xl mx-auto px-3 sm:px-4 py-8 md:py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mx-auto mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="lg:col-span-2 h-[600px] bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (submitted) {
    const successMsg = getSuccessMessage()
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-slate-950 dark:to-slate-900">
        <Header />
        
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-3 sm:p-4">
          <Card className="max-w-md w-full text-center shadow-xl">
            <CardContent className="pt-10 sm:pt-12 pb-6 sm:pb-8 px-4 sm:px-6">
              <div className="h-14 w-14 sm:h-16 sm:w-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2">{successMsg.title}</h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mb-4">{successMsg.message}</p>
              
              {isCredentialRecovery && (
                <div className="bg-blue-50 dark:bg-blue-950/30 p-3 sm:p-4 rounded-lg mb-6 text-left">
                  <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300 font-medium mb-2">What happens next?</p>
                  <ol className="text-xs sm:text-sm text-blue-700 dark:text-blue-400 space-y-1 list-decimal list-inside">
                    <li>Admin verifies your identity</li>
                    <li>Login details sent to registered email</li>
                    <li>SMS confirmation (if phone on file)</li>
                  </ol>
                </div>
              )}
              
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6">
                Reference: <span className="font-mono font-medium">{ticketId}</span>
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
                <Button onClick={() => window.location.href = '/'} variant="outline" className="text-sm">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
                <Button onClick={() => window.location.href = '/portal'} className="bg-blue-600 hover:bg-blue-700 text-sm">
                  Go to Portal
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <WhatsAppWidget />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-slate-950 dark:to-slate-900">
      <Header />

      {/* Hero Section - Replaces the old header */}
      <section className="relative bg-gradient-to-br from-[#0A2472] via-[#0d2e8a] to-[#1e3a8a] text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.4)_0%,transparent_50%)]" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-400 rounded-full blur-3xl opacity-20" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-400 rounded-full blur-3xl opacity-20" />
        </div>
        
        {/* Content */}
        <div className="relative container max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20 lg:py-24">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm rounded-full border border-white/20 mb-6">
              <MessageCircle className="h-4 w-4 text-amber-300" />
              <span className="text-sm font-medium text-white/90">We're Here to Help</span>
            </div>
            
            {/* Main Heading */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4">
              <span className="text-white">Get in </span>
              <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">Touch</span>
            </h1>
            
            {/* Description */}
            <p className="text-base sm:text-lg md:text-xl text-white/80 max-w-2xl mb-8">
              Have questions about admissions, academics, or need technical support? 
              Our dedicated team is ready to assist you with any inquiries.
            </p>
            
            {/* Quick Info Cards */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-3 px-5 py-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Headphones className="h-5 w-5 text-amber-300" />
                </div>
                <div>
                  <p className="text-xs text-white/60">Call Us</p>
                  <p className="text-sm sm:text-base font-semibold text-white" suppressHydrationWarning>
                    {CONTACT_INFO.phone}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 px-5 py-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                </div>
                <div>
                  <p className="text-xs text-white/60">Response Time</p>
                  <p className="text-sm sm:text-base font-semibold text-white">24-48 Hours</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 px-5 py-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-blue-300" />
                </div>
                <div>
                  <p className="text-xs text-white/60">Email Us</p>
                  <p className="text-sm sm:text-base font-semibold text-white truncate max-w-[200px] sm:max-w-none" suppressHydrationWarning>
                    {CONTACT_INFO.email}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Wave Decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 105C120 90 240 60 360 50C480 40 600 50 720 55C840 60 960 60 1080 50C1200 40 1320 20 1380 10L1440 0V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V120Z" 
                  fill="currentColor" 
                  className="text-blue-50 dark:text-slate-950"
                  opacity="0.5"
            />
            <path d="M0 120L40 112C80 104 160 88 240 84C320 80 400 88 480 92C560 96 640 96 720 92C800 88 880 80 960 78C1040 76 1120 80 1200 84C1280 88 1360 92 1400 94L1440 96V120H1400C1360 120 1280 120 1200 120C1120 120 1040 120 960 120C880 120 800 120 720 120C640 120 560 120 480 120C400 120 320 120 240 120C160 120 80 120 40 120H0V120Z" 
                  fill="currentColor" 
                  className="text-white dark:text-slate-900"
            />
          </svg>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="bg-white dark:bg-slate-900 border-b dark:border-slate-800">
        <div className="container max-w-6xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3">
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400">Home</Link>
            <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="text-slate-800 dark:text-slate-200 font-medium">Contact Us</span>
          </div>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-8 sm:py-10 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
          {/* Sidebar - Contact Info */}
          <div className="lg:col-span-1 space-y-3 sm:space-y-4 md:space-y-5">
            {/* Contact Card */}
            <Card className="shadow-md border-0">
              <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-5 pt-4 sm:pt-5">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  Contact Information
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Reach out to us anytime</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-5 pb-4 sm:pb-5">
                <div className="flex items-start gap-2.5 sm:gap-3">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-xs sm:text-sm">Address</p>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400" suppressHydrationWarning>
                      {CONTACT_INFO.address}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 sm:gap-3">
                  <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-xs sm:text-sm">Phone</p>
                    <a href={`tel:${CONTACT_INFO.phoneRaw}`} className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400" suppressHydrationWarning>
                      {CONTACT_INFO.phone}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 sm:gap-3">
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-xs sm:text-sm">Email</p>
                    <a href={`mailto:${CONTACT_INFO.email}`} className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 break-all" suppressHydrationWarning>
                      {CONTACT_INFO.email}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 sm:gap-3">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-xs sm:text-sm">Office Hours</p>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400" suppressHydrationWarning>
                      {CONTACT_INFO.hours.weekdays}<br />
                      {CONTACT_INFO.hours.saturday}<br />
                      <span className="text-red-500 dark:text-red-400">{CONTACT_INFO.hours.sunday}</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Social Media Card */}
            <Card className="shadow-md border-0">
              <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-5 pt-4 sm:pt-5">
                <CardTitle className="text-base sm:text-lg">Follow Us</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Stay connected on social media</CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-5 pb-4 sm:pb-5">
                <div className="flex flex-col sm:flex-row gap-2">
                  <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" 
                     className="flex-1 flex items-center justify-center gap-2 p-2.5 sm:p-3 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors">
                    <Facebook className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs sm:text-sm font-medium">Facebook</span>
                  </a>
                  <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer"
                     className="flex-1 flex items-center justify-center gap-2 p-2.5 sm:p-3 bg-pink-50 dark:bg-pink-950/30 hover:bg-pink-100 dark:hover:bg-pink-900/50 rounded-lg transition-colors">
                    <Instagram className="h-4 w-4 sm:h-5 sm:w-5 text-pink-600 dark:text-pink-400" />
                    <span className="text-xs sm:text-sm font-medium">Instagram</span>
                  </a>
                  <a href={SOCIAL_LINKS.twitter} target="_blank" rel="noopener noreferrer"
                     className="flex-1 flex items-center justify-center gap-2 p-2.5 sm:p-3 bg-sky-50 dark:bg-sky-950/30 hover:bg-sky-100 dark:hover:bg-sky-900/50 rounded-lg transition-colors">
                    <Twitter className="h-4 w-4 sm:h-5 sm:w-5 text-sky-600 dark:text-sky-400" />
                    <span className="text-xs sm:text-sm font-medium">Twitter</span>
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Forgot Login Card */}
            <Card className="shadow-md border-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
              <CardHeader className="pb-2 px-4 sm:px-5 pt-4 sm:pt-5">
                <CardTitle className="text-amber-800 dark:text-amber-300 text-base sm:text-lg flex items-center gap-2">
                  <KeyRound className="h-4 w-4 sm:h-5 sm:w-5" />
                  Forgot Login Details?
                </CardTitle>
                <CardDescription className="text-amber-700 dark:text-amber-400 text-xs sm:text-sm">
                  Lost your VIN ID or email?
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-5 pb-4 sm:pb-5">
                <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300 mb-3">
                  Select one of the recovery options in the form below:
                </p>
                <ul className="text-xs sm:text-sm text-amber-700 dark:text-amber-400 space-y-1">
                  <li className="flex items-center gap-2"><span className="text-sm">🔐</span> Forgot VIN ID</li>
                  <li className="flex items-center gap-2"><span className="text-sm">📧</span> Forgot Email</li>
                  <li className="flex items-center gap-2"><span className="text-sm">🔑</span> Forgot Login Details</li>
                </ul>
                <p className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-500 mt-3">
                  Response time: 24-48 hours
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0">
              <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-5 md:px-6 pt-4 sm:pt-5 md:pt-6">
                <CardTitle className="text-lg sm:text-xl md:text-2xl">Send us a Message</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Fill out the form below and we&apos;ll respond as soon as possible
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-5 md:px-6 pb-5 sm:pb-6 md:pb-7">
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label className="text-xs sm:text-sm">Full Name *</Label>
                      <Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" className="mt-1 sm:mt-1.5 text-sm h-9 sm:h-10" />
                    </div>
                    <div>
                      <Label className="text-xs sm:text-sm">Email *</Label>
                      <Input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="john@example.com" className="mt-1 sm:mt-1.5 text-sm h-9 sm:h-10" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label className="text-xs sm:text-sm">Phone (Optional)</Label>
                      <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+234 XXX XXX XXXX" className="mt-1 sm:mt-1.5 text-sm h-9 sm:h-10" />
                    </div>
                    <div>
                      <Label className="text-xs sm:text-sm">Inquiry Type *</Label>
                      <Select required value={formData.inquiry_type} onValueChange={(v) => setFormData({ ...formData, inquiry_type: v, subject: v })}>
                        <SelectTrigger className="mt-1 sm:mt-1.5 text-sm h-9 sm:h-10">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {inquiryTypes.map(t => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {isCredentialRecovery && (
                    <div className="border-t pt-4 sm:pt-5 space-y-3 sm:space-y-4">
                      <div className="flex items-start gap-2.5 sm:gap-3 bg-blue-50 dark:bg-blue-950/30 p-3 sm:p-4 rounded-lg">
                        <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                        <div>
                          <h4 className="font-semibold text-blue-900 dark:text-blue-300 text-xs sm:text-sm">Identity Verification Required</h4>
                          <p className="text-[11px] sm:text-xs md:text-sm text-blue-800 dark:text-blue-400">Please provide the following details to help us verify your identity.</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <Label className="text-xs sm:text-sm">Class *</Label>
                          <Select value={formData.student_class} onValueChange={(v) => setFormData({ ...formData, student_class: v })}>
                            <SelectTrigger className="mt-1 sm:mt-1.5 text-sm h-9 sm:h-10"><SelectValue placeholder="Select your class" /></SelectTrigger>
                            <SelectContent>{classes.map(c => (<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs sm:text-sm">Admission Year</Label>
                          <Input type="number" placeholder="e.g., 2023" value={formData.admission_year} onChange={(e) => setFormData({ ...formData, admission_year: e.target.value })} className="mt-1 sm:mt-1.5 text-sm h-9 sm:h-10" />
                        </div>
                      </div>
                      {formData.inquiry_type !== 'forgot_vin' && (
                        <div>
                          <Label className="text-xs sm:text-sm">VIN ID (If you remember it)</Label>
                          <Input placeholder="VIN-STD-2023-XXXX" value={formData.vin_id} onChange={(e) => setFormData({ ...formData, vin_id: e.target.value })} className="mt-1 sm:mt-1.5 text-sm h-9 sm:h-10" />
                        </div>
                      )}
                    </div>
                  )}

                  {!isCredentialRecovery && (
                    <div>
                      <Label className="text-xs sm:text-sm">Subject *</Label>
                      <Input required value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} placeholder="What is this about?" className="mt-1 sm:mt-1.5 text-sm h-9 sm:h-10" />
                    </div>
                  )}

                  <div>
                    <Label className="text-xs sm:text-sm">{isCredentialRecovery ? 'Additional Information (Optional)' : 'Message *'}</Label>
                    <Textarea required={!isCredentialRecovery} rows={4} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} placeholder={isCredentialRecovery ? "Any additional information..." : "Please provide as much detail as possible..."} className="mt-1 sm:mt-1.5 text-sm resize-none" />
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox id="urgent" checked={formData.is_urgent} onCheckedChange={(checked) => setFormData({ ...formData, is_urgent: checked as boolean })} />
                    <Label htmlFor="urgent" className="text-xs sm:text-sm font-normal cursor-pointer">This is an urgent inquiry</Label>
                  </div>

                  <div className="flex justify-end pt-3 sm:pt-4">
                    <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 w-full sm:w-auto min-w-[150px] sm:min-w-[180px] text-sm h-10 sm:h-11">
                      {loading ? 'Processing...' : (<><Send className="h-4 w-4 mr-2" />{isCredentialRecovery ? 'Submit Recovery Request' : 'Send Message'}</>)}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Map Section */}
        <div className="mt-6 sm:mt-8 md:mt-10">
          <Card className="shadow-md border-0 overflow-hidden">
            <CardContent className="p-0">
              <iframe title="Vincollins College Location" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3964.123456789!2d3.3456789!3d6.456789!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwMjcnMjQuNCJOIDPCsDIwJzQ0LjQiRQ!5e0!3m2!1sen!2sng!4v1234567890" width="100%" height="250" className="w-full sm:h-[280px] md:h-[300px]" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white dark:bg-slate-900 dark:border-slate-800 mt-8 md:mt-12">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 md:py-5">
          <p className="text-center text-[10px] sm:text-xs md:text-sm text-slate-500 dark:text-slate-400" suppressHydrationWarning>
            © {new Date().getFullYear()} Vincollins College. {CONTACT_INFO.address} | {CONTACT_INFO.phone}
          </p>
        </div>
      </footer>

      <WhatsAppWidget />
    </div>
  )
}