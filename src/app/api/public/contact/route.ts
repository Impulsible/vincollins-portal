import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    const {
      name,
      email,
      phone,
      vin_id,
      student_class,
      admission_year,
      subject,
      message,
      inquiry_type,
      is_urgent
    } = body
    
    // Validate required fields
    if (!name || !email || !inquiry_type) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, and inquiry type are required' },
        { status: 400 }
      )
    }
    
    // For credential recovery, require class
    const isCredentialRecovery = ['forgot_vin', 'forgot_email', 'forgot_both'].includes(inquiry_type)
    if (isCredentialRecovery && !student_class) {
      return NextResponse.json(
        { error: 'Class is required for credential recovery requests' },
        { status: 400 }
      )
    }
    
    // Build subject based on inquiry type if not provided
    let finalSubject = subject
    if (!finalSubject) {
      if (inquiry_type === 'forgot_vin') {
        finalSubject = `VIN Recovery Request - ${name}`
      } else if (inquiry_type === 'forgot_email') {
        finalSubject = `Email Recovery Request - ${name}`
      } else if (inquiry_type === 'forgot_both') {
        finalSubject = `Full Credential Recovery - ${name}`
      } else {
        finalSubject = `${inquiry_type} - ${name}`
      }
    }
    
    // Build detailed message for credential recovery
    let finalMessage = message || ''
    if (isCredentialRecovery) {
      const recoveryDetails = `
CREDENTIAL RECOVERY REQUEST
---------------------------
Name: ${name}
Email provided: ${email}
Phone: ${phone || 'Not provided'}
Class: ${student_class || 'Not provided'}
Admission Year: ${admission_year || 'Not provided'}
VIN ID (if remembered): ${vin_id || 'Not provided'}

Additional Information:
${message || 'None provided'}
`
      finalMessage = recoveryDetails
    }
    
    // Insert inquiry
    const { data: inquiry, error } = await supabase
      .from('contact_inquiries')
      .insert({
        name,
        email,
        phone: phone || null,
        vin_id: vin_id || null,
        student_class: student_class || null,
        admission_year: admission_year || null,
        subject: finalSubject,
        message: finalMessage,
        inquiry_type,
        is_urgent: is_urgent || false,
        status: 'unread'
      })
      .select()
      .single()
    
    if (error) {
      console.error('Database error:', error)
      throw error
    }
    
    // Generate ticket ID for user reference
    const ticketId = `TKT-${new Date().getFullYear()}-${inquiry.id.slice(0, 8).toUpperCase()}`
    
    return NextResponse.json({
      success: true,
      message: isCredentialRecovery 
        ? 'Your credential recovery request has been submitted. We will verify your identity and respond within 24-48 hours.'
        : 'Your message has been sent! We will get back to you soon.',
      inquiry_id: inquiry.id,
      ticket_id: ticketId
    })
    
  } catch (error: any) {
    console.error('Contact inquiry error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send message' },
      { status: 500 }
    )
  }
}