// app/admission/page.tsx - FIXED HEADER SPACING
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Send, CheckCircle, Home, ArrowLeft, Phone, Mail, MapPin, Clock, ChevronRight, GraduationCap, Headphones, Sparkles, MessageCircle } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { WhatsAppWidget } from '@/components/WhatsAppWidget'
import { cn } from '@/lib/utils'

const classes = ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3']
const genders = ['Male', 'Female']
const howDidYouHear = ['Website', 'Social Media', 'Friend/Family', 'School Visit', 'Advertisement', 'Other']

export default function AdmissionPage() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    applying_for_class: '',
    current_school: '',
    parent_name: '',
    parent_phone: '',
    parent_email: '',
    address: '',
    city: '',
    state: '',
    country: 'Nigeria',
    medical_conditions: '',
    how_did_you_hear: '',
    additional_notes: ''
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await fetch('/api/public/admission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit application')
      }
      
      setSubmitted(true)
      toast.success('Application submitted successfully!')
      
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
        <div className="h-16 sm:h-20 bg-gradient-to-r from-[#0A2472] to-[#1e3a8a]" />
        <div className="container max-w-4xl mx-auto px-4 py-8 md:py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mx-auto mb-8"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
        <Header />
        
        <div className="flex items-center justify-center p-4 pt-24 sm:pt-28 pb-16">
          <Card className="max-w-md w-full text-center">
            <CardContent className="pt-12 pb-8">
              <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-10 w-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
              <p className="text-slate-600 mb-6">
                Thank you for applying to Vincollins College. We will review your application and contact you within 3-5 business days.
              </p>
              <p className="text-sm text-slate-500 mb-4">
                Application ID: {formData.first_name.slice(0, 3)}-{Date.now().toString().slice(-6)}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/">
                  <Button variant="outline">
                    <Home className="h-4 w-4 mr-2" />
                    Home
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    Contact Us
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <WhatsAppWidget />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <Header />

      {/* Hero Section - FIXED: Proper padding from header */}
      <section className="relative bg-gradient-to-br from-[#0A2472] via-[#0d2e8a] to-[#1e3a8a] text-white overflow-hidden pt-20 sm:pt-24 lg:pt-28 pb-8 sm:pb-10 md:pb-12 lg:pb-16">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.4)_0%,transparent_50%)]" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-400 rounded-full blur-3xl opacity-20" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-400 rounded-full blur-3xl opacity-20" />
        </div>
        
        <div className="relative container max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl">
            {/* Badge with proper spacing */}
            <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-white/15 backdrop-blur-sm rounded-full border border-white/20 mb-5 sm:mb-6">
              <GraduationCap className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-amber-300" />
              <span className="text-xs sm:text-sm md:text-base font-medium text-white/90 whitespace-nowrap">Start Your Journey</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 sm:mb-5">
              <span className="text-white">Apply to </span>
              <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">Vincollins College</span>
            </h1>
            
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/80 max-w-2xl mb-6 sm:mb-8">
              Join a community that nurtures excellence. Submit your application today and take the first step towards a bright future.
            </p>
            
            <div className="flex flex-wrap gap-3 sm:gap-4">
              <Link href="#apply-form">
                <div className="flex items-center gap-3 px-4 py-2.5 sm:px-5 sm:py-3 bg-amber-500/90 hover:bg-amber-500 backdrop-blur-sm rounded-xl border border-amber-400/30 transition-all duration-300 cursor-pointer shadow-lg">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white/20 flex items-center justify-center">
                    <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-white/80">Apply Now</p>
                    <p className="text-xs sm:text-sm md:text-base font-semibold text-white">Start Application</p>
                  </div>
                </div>
              </Link>
              
              <div className="flex items-center gap-3 px-4 py-2.5 sm:px-5 sm:py-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <span className="relative flex h-2 w-2 sm:h-3 sm:w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 sm:h-3 sm:w-3 bg-emerald-500"></span>
                  </span>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-white/60">Processing Time</p>
                  <p className="text-xs sm:text-sm md:text-base font-semibold text-white">3-5 Days</p>
                </div>
              </div>
              
              <Link href="/contact">
                <div className="flex items-center gap-3 px-4 py-2.5 sm:px-5 sm:py-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Headphones className="h-4 w-4 sm:h-5 sm:w-5 text-blue-300" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-white/60">Need Help?</p>
                    <p className="text-xs sm:text-sm md:text-base font-semibold text-white">Contact Us</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 105C120 90 240 60 360 50C480 40 600 50 720 55C840 60 960 60 1080 50C1200 40 1320 20 1380 10L1440 0V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V120Z" 
                  fill="currentColor" 
                  className="text-emerald-50 dark:text-slate-950"
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
            <Link href="/" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1">
              <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Home</span>
            </Link>
            <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="text-slate-800 dark:text-slate-200 font-medium">Admission</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-4xl mx-auto px-4 py-8 md:py-12" id="apply-form">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative h-20 w-20 md:h-24 md:w-24">
              <Image
                src="/images/logo.png"
                alt="Vincollins College Logo"
                fill
                className="object-contain"
              />
            </div>
          </div>
          <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
            Start Your Journey
          </h1>
          <p className="text-slate-600 text-sm md:text-base">
            Join Vincollins College - Where Excellence Meets Opportunity
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
            <CardDescription>Please fill in all required fields (*)</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Student Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label>First Name *</Label>
                  <Input
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Middle Name</Label>
                  <Input
                    value={formData.middle_name}
                    onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Last Name *</Label>
                  <Input
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Phone *</Label>
                  <Input
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Gender</Label>
                  <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      {genders.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Applying for Class *</Label>
                  <Select required value={formData.applying_for_class} onValueChange={(v) => setFormData({ ...formData, applying_for_class: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Current School</Label>
                <Input
                  value={formData.current_school}
                  onChange={(e) => setFormData({ ...formData, current_school: e.target.value })}
                  className="mt-1"
                />
              </div>

              {/* Parent/Guardian Details */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Parent/Guardian Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Parent/Guardian Name *</Label>
                    <Input
                      required
                      value={formData.parent_name}
                      onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Parent Phone *</Label>
                    <Input
                      required
                      value={formData.parent_phone}
                      onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Parent Email</Label>
                    <Input
                      type="email"
                      value={formData.parent_email}
                      onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Address</h3>
                <div>
                  <Label>Street Address</Label>
                  <Textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={2}
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  <div>
                    <Label>City</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Input
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Country</Label>
                    <Input
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
                <div>
                  <Label>Medical Conditions (if any)</Label>
                  <Textarea
                    value={formData.medical_conditions}
                    onChange={(e) => setFormData({ ...formData, medical_conditions: e.target.value })}
                    placeholder="Allergies, medications, or special needs..."
                    rows={2}
                    className="mt-1"
                  />
                </div>
                <div className="mt-4">
                  <Label>How did you hear about us?</Label>
                  <Select value={formData.how_did_you_hear} onValueChange={(v) => setFormData({ ...formData, how_did_you_hear: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      {howDidYouHear.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="mt-4">
                  <Label>Additional Notes</Label>
                  <Textarea
                    value={formData.additional_notes}
                    onChange={(e) => setFormData({ ...formData, additional_notes: e.target.value })}
                    placeholder="Any other information you'd like to share..."
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                <Link href="/">
                  <Button type="button" variant="outline" className="w-full sm:w-auto">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Home
                  </Button>
                </Link>
                <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto">
                  {loading ? (
                    <>Submitting...</>
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
      </div>

      {/* Footer */}
      <footer className="border-t bg-white mt-8 md:mt-12">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-3">
            <Link href="/" className="text-xs sm:text-sm text-slate-500 hover:text-emerald-600 transition-colors flex items-center gap-1">
              <Home className="h-3 w-3" />
              Home
            </Link>
            <span className="text-slate-300">|</span>
            <Link href="/admission" className="text-xs sm:text-sm text-emerald-600 font-medium">
              Admission
            </Link>
            <span className="text-slate-300">|</span>
            <Link href="/contact" className="text-xs sm:text-sm text-slate-500 hover:text-emerald-600 transition-colors">
              Contact
            </Link>
            <span className="text-slate-300">|</span>
            <Link href="/portal" className="text-xs sm:text-sm text-slate-500 hover:text-emerald-600 transition-colors">
              Portal
            </Link>
          </div>
          <p className="text-center text-xs sm:text-sm text-slate-500" suppressHydrationWarning>
            © {new Date().getFullYear()} Vincollins College. All rights reserved.
          </p>
        </div>
      </footer>

      <WhatsAppWidget />
    </div>
  )
}