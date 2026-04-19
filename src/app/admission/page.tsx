'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { 
  Send, CheckCircle, Home, User, Mail, Phone,
  MessageCircle, ArrowRight, ArrowLeft, Sparkles, Shield, Target
} from 'lucide-react'

const classes = ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3']
const genders = ['Male', 'Female']
const howDidYouHear = [
  'Website',
  'Social Media',
  'Friend/Family',
  'School Visit',
  'Advertisement',
  'Other'
]

const CONTACT_INFO = {
  address: '7/9, Lawani Street, off Ishaga Rd, Surulere, Lagos',
  phone: '+234 912 1155 554',
  whatsapp: '+2349121155554'
}

const WHATSAPP_MESSAGE = 'Hello, I have questions about admission to Vincollins College.'

export default function AdmissionPage() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [referenceId, setReferenceId] = useState('')
  const [currentStep, setCurrentStep] = useState(1)
  
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

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
      
      setReferenceId(data.reference_id)
      setSubmitted(true)
      toast.success('Application submitted successfully!')
      
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.first_name || !formData.last_name || !formData.email || !formData.phone || !formData.applying_for_class) {
        toast.error('Please fill in all required fields')
        return
      }
    }
    if (currentStep === 2) {
      if (!formData.parent_name || !formData.parent_phone) {
        toast.error('Parent/Guardian information is required')
        return
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 3))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent(WHATSAPP_MESSAGE)
    window.open(`https://wa.me/${CONTACT_INFO.whatsapp.replace(/\D/g, '')}?text=${message}`, '_blank')
  }

  const totalSteps = 3
  const progress = (currentStep / totalSteps) * 100

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
        <Header user={undefined} onLogout={() => {}} />
        
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
          <Card className="max-w-md w-full text-center">
            <CardContent className="pt-12 pb-8">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
              <p className="text-slate-600 mb-4">
                Thank you for applying to Vincollins College. We will review your application and contact you within 3-5 business days.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-blue-800 font-medium">Your Reference ID</p>
                <p className="text-xl font-mono font-bold text-blue-900">{referenceId}</p>
                <p className="text-xs text-blue-600 mt-2">Please save this for future reference</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => window.location.href = '/'} variant="outline">
                  <Home className="h-4 w-4 mr-2" />
                  Return Home
                </Button>
                <Button onClick={handleWhatsAppClick} className="bg-green-600 hover:bg-green-700">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Questions? Chat on WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <Header user={undefined} onLogout={() => {}} />

      {/* Main Content */}
      <div className="container max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative h-20 w-20 md:h-24 md:w-24">
              <Image
                src="/logo.png"
                alt="Vincollins College Logo"
                fill
                className="object-contain"
              />
            </div>
          </div>
          <h2 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
            Admission Application
          </h2>
          <p className="text-slate-600 text-sm md:text-base">
            Join Vincollins College - Where Excellence Meets Opportunity
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-600">Step {currentStep} of {totalSteps}</p>
            <p className="text-sm text-slate-600">{Math.round(progress)}% Complete</p>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-600 to-teal-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Why Choose Us - Step 1 Only */}
        {currentStep === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {[
              { icon: Shield, title: 'Excellence', desc: 'Academic excellence since 1985' },
              { icon: Target, title: 'Future Ready', desc: 'Preparing leaders for tomorrow' },
              { icon: Sparkles, title: 'Holistic', desc: 'Mind, body & character development' }
            ].map((item, i) => (
              <div key={i} className="bg-white/60 backdrop-blur-sm rounded-xl p-3 text-center border border-emerald-100">
                <item.icon className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                <p className="font-semibold text-sm text-emerald-900">{item.title}</p>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {currentStep === 1 && 'Student Information'}
              {currentStep === 2 && 'Parent/Guardian & Address'}
              {currentStep === 3 && 'Additional Information'}
            </CardTitle>
            <CardDescription>
              Please fill in all required fields marked with *
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* STEP 1: Student Information */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <Label>First Name *</Label>
                      <Input
                        required
                        value={formData.first_name}
                        onChange={(e) => handleInputChange('first_name', e.target.value)}
                        placeholder="John"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Middle Name</Label>
                      <Input
                        value={formData.middle_name}
                        onChange={(e) => handleInputChange('middle_name', e.target.value)}
                        placeholder="Optional"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Last Name *</Label>
                      <Input
                        required
                        value={formData.last_name}
                        onChange={(e) => handleInputChange('last_name', e.target.value)}
                        placeholder="Doe"
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
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="john@example.com"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Phone *</Label>
                      <Input
                        required
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+234 XXX XXX XXXX"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <Label>Date of Birth</Label>
                      <Input
                        type="date"
                        value={formData.date_of_birth}
                        onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Gender</Label>
                      <Select value={formData.gender} onValueChange={(v) => handleInputChange('gender', v)}>
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
                      <Select required value={formData.applying_for_class} onValueChange={(v) => handleInputChange('applying_for_class', v)}>
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
                      onChange={(e) => handleInputChange('current_school', e.target.value)}
                      placeholder="Name of current school"
                      className="mt-1"
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: Parent & Address */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="border-b pb-2">
                    <h3 className="font-semibold text-emerald-900">Parent/Guardian Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Parent/Guardian Name *</Label>
                      <Input
                        required
                        value={formData.parent_name}
                        onChange={(e) => handleInputChange('parent_name', e.target.value)}
                        placeholder="Full name"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Parent Phone *</Label>
                      <Input
                        required
                        value={formData.parent_phone}
                        onChange={(e) => handleInputChange('parent_phone', e.target.value)}
                        placeholder="+234 XXX XXX XXXX"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Parent Email</Label>
                      <Input
                        type="email"
                        value={formData.parent_email}
                        onChange={(e) => handleInputChange('parent_email', e.target.value)}
                        placeholder="parent@example.com"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="border-b pt-2 pb-2">
                    <h3 className="font-semibold text-emerald-900">Address</h3>
                  </div>

                  <div>
                    <Label>Street Address</Label>
                    <Textarea
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Street address"
                      className="mt-1"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <Label>City</Label>
                      <Input
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="City"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>State</Label>
                      <Input
                        value={formData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        placeholder="State"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Country</Label>
                      <Input
                        value={formData.country}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                        placeholder="Country"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Additional Information */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <Label>Medical Conditions (if any)</Label>
                    <Textarea
                      value={formData.medical_conditions}
                      onChange={(e) => handleInputChange('medical_conditions', e.target.value)}
                      placeholder="Allergies, medications, or special needs..."
                      className="mt-1"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label>How did you hear about us?</Label>
                    <Select value={formData.how_did_you_hear} onValueChange={(v) => handleInputChange('how_did_you_hear', v)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        {howDidYouHear.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Additional Notes</Label>
                    <Textarea
                      value={formData.additional_notes}
                      onChange={(e) => handleInputChange('additional_notes', e.target.value)}
                      placeholder="Any other information you'd like to share..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                      By submitting this application, you confirm that all information provided is accurate and complete.
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4 border-t">
                {currentStep > 1 ? (
                  <Button type="button" variant="outline" onClick={prevStep}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                ) : (
                  <div></div>
                )}
                
                {currentStep < totalSteps ? (
                  <Button type="button" onClick={nextStep} className="bg-emerald-600 hover:bg-emerald-700">
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
                    {loading ? (
                      <>Submitting...</>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Application
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            Questions? Call us at <span className="font-medium text-emerald-600">{CONTACT_INFO.phone}</span> or 
            visit us at <span className="font-medium">{CONTACT_INFO.address}</span>
          </p>
        </div>
      </div>

      {/* WhatsApp Floating Widget */}
      <button
        onClick={handleWhatsAppClick}
        className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 group animate-bounce"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="h-6 w-6" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 whitespace-nowrap text-sm font-medium">
          Admission Questions?
        </span>
      </button>

      {/* Footer */}
      <footer className="border-t bg-white mt-8 md:mt-12">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <p className="text-center text-xs md:text-sm text-slate-500">
            © {new Date().getFullYear()} Vincollins College. {CONTACT_INFO.address} | {CONTACT_INFO.phone}
          </p>
        </div>
      </footer>
    </div>
  )
}