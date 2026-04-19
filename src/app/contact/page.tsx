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
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { 
  Mail, Phone, MapPin, Clock, Send, CheckCircle, 
  KeyRound, AlertCircle, MessageCircle, Home
} from 'lucide-react'

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
  email: 'info@vincollins.edu.ng',
  supportEmail: 'support@vincollins.edu.ng',
  whatsapp: '+2349121155554'
}

const WHATSAPP_MESSAGE = 'Hello Vincollins College, I have a question about...'

export default function ContactPage() {
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

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent(WHATSAPP_MESSAGE)
    window.open(`https://wa.me/${CONTACT_INFO.whatsapp.replace(/\D/g, '')}?text=${message}`, '_blank')
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

  if (submitted) {
    const successMsg = getSuccessMessage()
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <Header user={undefined} onLogout={() => {}} />
        
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
          <Card className="max-w-md w-full text-center">
            <CardContent className="pt-12 pb-8">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">{successMsg.title}</h2>
              <p className="text-slate-600 mb-4">{successMsg.message}</p>
              
              {isCredentialRecovery && (
                <div className="bg-blue-50 p-4 rounded-lg mb-6 text-left">
                  <p className="text-sm text-blue-800 font-medium mb-2">What happens next?</p>
                  <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                    <li>Admin verifies your identity</li>
                    <li>Login details sent to registered email</li>
                    <li>SMS confirmation (if phone on file)</li>
                  </ol>
                </div>
              )}
              
              <p className="text-sm text-slate-500 mb-6">
                Reference: <span className="font-mono font-medium">{ticketId}</span>
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => window.location.href = '/'} variant="outline">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
                <Button onClick={() => window.location.href = '/portal'} className="bg-blue-600 hover:bg-blue-700">
                  Go to Portal
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
      <Header user={undefined} onLogout={() => {}} />

      {/* Main Content */}
      <div className="container max-w-6xl mx-auto px-4 py-8 md:py-12">
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
          <h2 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Contact Us
          </h2>
          <p className="text-slate-600 text-sm md:text-base">
            Have questions? We're here to help!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4 md:space-y-6">
            {/* Contact Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Get in Touch</CardTitle>
                <CardDescription>Reach out to us anytime</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Address</p>
                    <p className="text-sm text-slate-600">
                      {CONTACT_INFO.address}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Phone</p>
                    <p className="text-sm text-slate-600">
                      {CONTACT_INFO.phone}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Email</p>
                    <p className="text-sm text-slate-600 break-all">
                      {CONTACT_INFO.email}<br />
                      {CONTACT_INFO.supportEmail}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Office Hours</p>
                    <p className="text-sm text-slate-600">
                      Mon-Fri: 8:00 AM - 4:00 PM<br />
                      Sat: 9:00 AM - 12:00 PM
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Forgot Login Card */}
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
              <CardHeader>
                <CardTitle className="text-amber-800 text-lg flex items-center gap-2">
                  <KeyRound className="h-5 w-5" />
                  Forgot Login Details?
                </CardTitle>
                <CardDescription className="text-amber-700">
                  Lost your VIN ID or email?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-amber-800 mb-3">
                  Select one of the recovery options in the form:
                </p>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>🔐 Forgot VIN ID</li>
                  <li>📧 Forgot Email</li>
                  <li>🔑 Forgot Login Details</li>
                </ul>
                <p className="text-xs text-amber-600 mt-3">
                  Response time: 24-48 hours
                </p>
              </CardContent>
            </Card>

            {/* WhatsApp Card */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 bg-green-500 rounded-full flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-800">Chat on WhatsApp</h3>
                    <p className="text-xs text-green-600">Quick responses</p>
                  </div>
                </div>
                <Button 
                  onClick={handleWhatsAppClick}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Message us on WhatsApp
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl">Send us a Message</CardTitle>
              <CardDescription>
                Fill out the form and we'll respond as soon as possible
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name and Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name *</Label>
                    <Input
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="John Doe"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@example.com"
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Phone and Inquiry Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Phone (Optional)</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+234 XXX XXX XXXX"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Inquiry Type *</Label>
                    <Select 
                      required 
                      value={formData.inquiry_type} 
                      onValueChange={(v) => setFormData({ 
                        ...formData, 
                        inquiry_type: v,
                        subject: v
                      })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {inquiryTypes.map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Credential Recovery Section */}
                {isCredentialRecovery && (
                  <div className="border-t pt-5 space-y-4">
                    <div className="flex items-start gap-3 bg-blue-50 p-3 md:p-4 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="font-semibold text-blue-900 text-sm">Identity Verification Required</h4>
                        <p className="text-xs md:text-sm text-blue-800">
                          Please provide the following details to help us verify your identity.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Class *</Label>
                        <Select 
                          value={formData.student_class} 
                          onValueChange={(v) => setFormData({ ...formData, student_class: v })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select your class" />
                          </SelectTrigger>
                          <SelectContent>
                            {classes.map(c => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Admission Year</Label>
                        <Input
                          type="number"
                          placeholder="e.g., 2023"
                          value={formData.admission_year}
                          onChange={(e) => setFormData({ ...formData, admission_year: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    {formData.inquiry_type !== 'forgot_vin' && (
                      <div>
                        <Label>VIN ID (If you remember it)</Label>
                        <Input
                          placeholder="VIN-STD-2023-XXXX"
                          value={formData.vin_id}
                          onChange={(e) => setFormData({ ...formData, vin_id: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Subject (for non-recovery) */}
                {!isCredentialRecovery && (
                  <div>
                    <Label>Subject *</Label>
                    <Input
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="What is this about?"
                      className="mt-1"
                    />
                  </div>
                )}

                {/* Message */}
                <div>
                  <Label>{isCredentialRecovery ? 'Additional Information (Optional)' : 'Message *'}</Label>
                  <Textarea
                    required={!isCredentialRecovery}
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder={isCredentialRecovery 
                      ? "Any additional information that might help us verify your identity..."
                      : "Please provide as much detail as possible..."
                    }
                    className="mt-1"
                  />
                </div>

                {/* Urgent Checkbox */}
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="urgent"
                    checked={formData.is_urgent}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_urgent: checked as boolean })}
                  />
                  <Label htmlFor="urgent" className="text-sm font-normal cursor-pointer">
                    This is an urgent inquiry
                  </Label>
                </div>

                {/* Submit Button */}
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
                        {isCredentialRecovery ? 'Submit Recovery Request' : 'Send Message'}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
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
          Chat with us
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