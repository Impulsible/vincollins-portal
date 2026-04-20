/* eslint-disable @typescript-eslint/no-unused-vars */
// app/admissions/page.tsx - COMPLETE ADMISSIONS PAGE
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { 
  GraduationCap, Calendar, Clock, FileText, CheckCircle, ChevronRight,
  Home, Send, Users, Award, BookOpen, School, Heart, Sparkles, ArrowRight,
  MapPin, Phone, Mail, Globe
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Dynamically import Header with SSR disabled
const Header = dynamic(() => import('@/components/layout/header').then(mod => ({ default: mod.Header })), {
  ssr: false,
  loading: () => <div className="h-16 bg-gradient-to-r from-[#0A2472] to-[#1e3a8a]" />
})

const programs = [
  {
    title: 'Crèche & Playgroup',
    age: '3 months - 3 years',
    description: 'A safe, nurturing environment where young children learn through play and exploration.',
    icon: Heart,
    color: 'bg-pink-50 text-pink-600',
    features: ['Safe environment', 'Sensory play', 'Early socialization']
  },
  {
    title: 'Nursery',
    age: '3 - 5 years',
    description: 'Foundation stage with focus on early literacy, numeracy, and social skills.',
    icon: Sparkles,
    color: 'bg-purple-50 text-purple-600',
    features: ['Early literacy', 'Numeracy skills', 'Creative arts']
  },
  {
    title: 'Primary',
    age: '5 - 11 years',
    description: 'Comprehensive primary education building strong academic foundations.',
    icon: BookOpen,
    color: 'bg-blue-50 text-blue-600',
    features: ['Core subjects', 'Sports & arts', 'Character education']
  },
  {
    title: 'College',
    age: '11 - 17 years',
    description: 'Junior and Senior Secondary education preparing students for higher education.',
    icon: GraduationCap,
    color: 'bg-emerald-50 text-emerald-600',
    features: ['WAEC/NECO prep', 'CBT exams', 'Career guidance']
  }
]

const steps = [
  { title: 'Submit Application', description: 'Complete the online application form' },
  { title: 'Assessment', description: 'Entrance examination and interview' },
  { title: 'Document Review', description: 'Submit required documents' },
  { title: 'Enrollment', description: 'Complete payment and registration' }
]

const features = [
  { icon: Users, title: 'Small Class Sizes', description: 'Personalized attention for every student' },
  { icon: Award, title: 'Qualified Teachers', description: 'Experienced and dedicated educators' },
  { icon: School, title: 'Modern Facilities', description: 'Well-equipped classrooms and labs' },
  { icon: Globe, title: 'CBT Platform', description: 'Computer-based testing for exam preparation' }
]

// ✅ Contact Information
const CONTACT_INFO = {
  address: '7/9, Lawani Street, off Ishaga Rd, Surulere, Lagos',
  phone: '+234 912 1155 554',
  phoneRaw: '+2349121155554',
  email: 'vincollinscollege@gmail.com',
}

const classes = ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3']

export default function AdmissionsPage() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  
  const [formData, setFormData] = useState({
    student_name: '',
    date_of_birth: '',
    parent_name: '',
    parent_email: '',
    parent_phone: '',
    applying_for_class: '',
    current_school: '',
    message: ''
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.student_name || !formData.parent_name || !formData.parent_email || !formData.applying_for_class) {
      toast.error('Please fill in all required fields')
      return
    }
    
    setLoading(true)
    
    try {
      const response = await fetch('/api/public/admissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) {
        throw new Error('Failed to submit application')
      }
      
      setSubmitted(true)
      toast.success('Application submitted successfully!')
      
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit application')
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="h-16 bg-gradient-to-r from-[#0A2472] to-[#1e3a8a]" />
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
            <div className="h-64 bg-gray-200 rounded mb-8"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <Header />
        
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
          <Card className="max-w-md w-full text-center">
            <CardContent className="pt-12 pb-8">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
              <p className="text-slate-600 mb-6">
                Thank you for applying to Vincollins College. Our admissions team will review your application and contact you within 2-3 business days.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg mb-6 text-left">
                <p className="text-sm text-blue-800 font-medium mb-2">What happens next?</p>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Application review (2-3 days)</li>
                  <li>Entrance exam scheduling</li>
                  <li>Interview with parents</li>
                  <li>Admission decision</li>
                </ol>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => window.location.href = '/'} variant="outline">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
                <Button onClick={() => window.location.href = '/contact'} className="bg-blue-600 hover:bg-blue-700">
                  Contact Admissions
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header />

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link href="/" className="hover:text-blue-600">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-slate-800 font-medium">Admissions</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#0A2472] to-[#1e3a8a] text-white py-12 md:py-16">
        <div className="container max-w-6xl mx-auto px-4 text-center">
          <Badge className="mb-4 bg-white/20 text-white border-white/30">Now Accepting Applications</Badge>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Join Vincollins College</h1>
          <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto">
            Begin your journey towards excellence. Applications for the 2025/2026 academic session are now open.
          </p>
        </div>
      </section>

      <div className="container max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* Programs Section */}
        <div className="mb-12 md:mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Our Academic Programs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {programs.map((program, index) => {
              const Icon = program.icon
              return (
                <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className={cn("h-12 w-12 rounded-lg flex items-center justify-center mb-4", program.color)}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-lg mb-1">{program.title}</h3>
                    <p className="text-sm text-blue-600 mb-2">{program.age}</p>
                    <p className="text-sm text-slate-600 mb-3">{program.description}</p>
                    <ul className="space-y-1">
                      {program.features.map((feature, i) => (
                        <li key={i} className="text-xs text-slate-500 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-12 md:mb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="text-center p-4">
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-sm">{feature.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Application Form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl">Apply Now</CardTitle>
              <CardDescription>
                Fill out the form below to begin your application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Student Full Name *</Label>
                    <Input
                      required
                      value={formData.student_name}
                      onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                      placeholder="John Doe"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Date of Birth *</Label>
                    <Input
                      type="date"
                      required
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Parent/Guardian Name *</Label>
                    <Input
                      required
                      value={formData.parent_name}
                      onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                      placeholder="Parent name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Applying for Class *</Label>
                    <Select 
                      required 
                      value={formData.applying_for_class} 
                      onValueChange={(v) => setFormData({ ...formData, applying_for_class: v })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Creche">Crèche/Playgroup</SelectItem>
                        <SelectItem value="Nursery">Nursery</SelectItem>
                        <SelectItem value="Primary">Primary</SelectItem>
                        {classes.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Parent Email *</Label>
                    <Input
                      type="email"
                      required
                      value={formData.parent_email}
                      onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
                      placeholder="parent@example.com"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Parent Phone *</Label>
                    <Input
                      required
                      value={formData.parent_phone}
                      onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                      placeholder="+234 XXX XXX XXXX"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label>Current School (Optional)</Label>
                  <Input
                    value={formData.current_school}
                    onChange={(e) => setFormData({ ...formData, current_school: e.target.value })}
                    placeholder="Current school name"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Additional Information (Optional)</Label>
                  <Textarea
                    rows={3}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Any additional information you'd like to share..."
                    className="mt-1"
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    type="submit" 
                    disabled={loading} 
                    className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto min-w-[150px]"
                  >
                    {loading ? (
                      <>Processing...</>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Application
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Admission Steps */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Admission Process</CardTitle>
                <CardDescription>Our simple 4-step process</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {steps.map((step, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{step.title}</p>
                        <p className="text-xs text-slate-500">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contact Card */}
            <Card className="bg-gradient-to-br from-slate-50 to-blue-50">
              <CardHeader>
                <CardTitle className="text-lg">Need Help?</CardTitle>
                <CardDescription>Contact our admissions team</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Call Us</p>
                    <a href={`tel:${CONTACT_INFO.phoneRaw}`} className="text-sm text-slate-600 hover:text-blue-600" suppressHydrationWarning>
                      {CONTACT_INFO.phone}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Email Us</p>
                    <a href={`mailto:${CONTACT_INFO.email}`} className="text-sm text-slate-600 hover:text-blue-600 break-all" suppressHydrationWarning>
                      {CONTACT_INFO.email}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Visit Us</p>
                    <p className="text-sm text-slate-600" suppressHydrationWarning>
                      {CONTACT_INFO.address}
                    </p>
                  </div>
                </div>
                <Link href="/contact">
                  <Button variant="outline" className="w-full mt-2">
                    Contact Admissions
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white mt-8 md:mt-12">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <p className="text-center text-xs md:text-sm text-slate-500" suppressHydrationWarning>
            © {new Date().getFullYear()} Vincollins College. {CONTACT_INFO.address} | {CONTACT_INFO.phone}
          </p>
        </div>
      </footer>
    </div>
  )
}