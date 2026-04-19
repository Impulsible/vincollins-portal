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
      first_name,
      middle_name,
      last_name,
      email,
      phone,
      date_of_birth,
      gender,
      applying_for_class,
      current_school,
      parent_name,
      parent_phone,
      parent_email,
      address,
      city,
      state,
      country,
      medical_conditions,
      how_did_you_hear,
      additional_notes
    } = body
    
    // Validate required fields
    if (!first_name || !last_name || !email || !phone || !applying_for_class || !parent_name || !parent_phone) {
      return NextResponse.json(
        { error: 'Missing required fields: first name, last name, email, phone, class, parent name, and parent phone are required' },
        { status: 400 }
      )
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }
    
    // Check for duplicate pending application
    const { data: existing } = await supabase
      .from('admission_applications')
      .select('id')
      .eq('email', email)
      .eq('applying_for_class', applying_for_class)
      .eq('status', 'pending')
      .maybeSingle()
    
    if (existing) {
      return NextResponse.json(
        { error: 'You already have a pending application for this class. Please wait for it to be processed.' },
        { status: 409 }
      )
    }
    
    // Insert application
    const { data: application, error } = await supabase
      .from('admission_applications')
      .insert({
        first_name,
        middle_name: middle_name || null,
        last_name,
        email,
        phone,
        date_of_birth: date_of_birth || null,
        gender: gender || null,
        applying_for_class,
        current_school: current_school || null,
        parent_name,
        parent_phone,
        parent_email: parent_email || null,
        address: address || null,
        city: city || null,
        state: state || null,
        country: country || 'Nigeria',
        medical_conditions: medical_conditions || null,
        how_did_you_hear: how_did_you_hear || null,
        additional_notes: additional_notes || null,
        status: 'pending'
      })
      .select()
      .single()
    
    if (error) {
      console.error('Database error:', error)
      throw error
    }
    
    // Generate application ID for user reference
    const appId = `APP-${new Date().getFullYear()}-${application.id.slice(0, 8).toUpperCase()}`
    
    return NextResponse.json({
      success: true,
      message: 'Your admission application has been submitted successfully! We will review it and contact you within 3-5 business days.',
      application_id: application.id,
      reference_id: appId
    })
    
  } catch (error: any) {
    console.error('Admission application error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to submit application' },
      { status: 500 }
    )
  }
}

// Optional: GET endpoint to check application status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')
    const applicationId = searchParams.get('id')
    
    if (!email && !applicationId) {
      return NextResponse.json(
        { error: 'Email or Application ID is required' },
        { status: 400 }
      )
    }
    
    let query = supabase
      .from('admission_applications')
      .select('id, first_name, last_name, applying_for_class, status, created_at, reviewed_at')
    
    if (applicationId) {
      query = query.eq('id', applicationId)
    } else if (email) {
      query = query.eq('email', email).order('created_at', { ascending: false }).limit(5)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    return NextResponse.json({ applications: data })
    
  } catch (error: any) {
    console.error('Error fetching applications:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch applications' },
      { status: 500 }
    )
  }
}