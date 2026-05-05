/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, serviceRoleKey)
}

// Generate random 4 digits
function secureRandomNumber(length: number = 4): string {
  return Math.floor(Math.random() * Math.pow(10, length)).toString().padStart(length, '0')
}

// Generate unique email from first and last name
async function generateUniqueEmail(
  supabaseAdmin: any, 
  firstName: string, 
  lastName: string
): Promise<string> {
  const sanitizedFirst = firstName.toLowerCase().replace(/[^a-z]/g, '').substring(0, 15) || 'user'
  const sanitizedLast = lastName.toLowerCase().replace(/[^a-z]/g, '').substring(0, 15) || 'account'
  const baseEmail = `${sanitizedFirst}.${sanitizedLast}@vincollins.edu.ng`
  
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('email')
    .eq('email', baseEmail)
    .maybeSingle()
  
  if (!data) return baseEmail
  
  const randomSuffix = secureRandomNumber(3)
  return `${sanitizedFirst}.${sanitizedLast}${randomSuffix}@vincollins.edu.ng`
}

// Generate VIN ID
function generateVinId(role: string, year?: number): string {
  const admissionYear = year || new Date().getFullYear()
  const randomNum = secureRandomNumber(4)
  
  const prefixes: Record<string, string> = {
    admin: 'VIN-ADM',
    staff: 'VIN-STF',
    student: 'VIN-STD'
  }
  
  const prefix = prefixes[role] || 'VIN-STD'
  return `${prefix}-${admissionYear}-${randomNum}`
}

// Format full name: "FirstName MiddleName LastName"
function formatFullName(firstName: string, lastName: string, middleName?: string): string {
  const parts = [firstName.trim()]
  if (middleName?.trim()) parts.push(middleName.trim())
  parts.push(lastName.trim())
  return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ')
}

// Format display name: "LastName FirstName MiddleName"
function formatDisplayName(firstName: string, lastName: string, middleName?: string): string {
  const parts = [lastName.trim(), firstName.trim()]
  if (middleName?.trim()) parts.push(middleName.trim())
  return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ')
}

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const body = await req.json()
    
    console.log('📦 Received body:', body)
    
    const { 
      first_name, 
      middle_name,
      last_name, 
      role, 
      class: studentClass, 
      department, 
      phone, 
      address,
      admission_year,
      join_year
    } = body
    
    // Validate required fields
    if (!first_name || !last_name || !role) {
      console.error('❌ Missing required fields:', { first_name, last_name, role })
      return NextResponse.json({ 
        error: 'First name, last name, and role are required' 
      }, { status: 400 })
    }
    
    const year = admission_year || join_year || new Date().getFullYear()
    
    // ✅ GENERATE credentials (API generates these, frontend does NOT send them)
    const email = await generateUniqueEmail(supabaseAdmin, first_name, last_name)
    const vinId = generateVinId(role, year)
    const fullName = formatFullName(first_name, last_name, middle_name)
    const displayName = formatDisplayName(first_name, last_name, middle_name)
    
    console.log('📧 Creating user:', { email, vinId, fullName, displayName, role })
    
    // STEP 1: Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: vinId,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        display_name: displayName,
        first_name: first_name.trim(),
        middle_name: middle_name?.trim() || '',
        last_name: last_name.trim(),
        role: role,
        class: studentClass || null,
        department: department || null,
        admission_year: year,
        phone: phone || null,
        address: address || null,
        vin_id: vinId
      }
    })
    
    if (authError) {
      console.error('❌ Auth creation error:', authError)
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }
    
    const userId = authData.user.id
    console.log('✅ Auth user created:', userId)
    
    // STEP 2: Insert into profiles (FULL data - all columns exist here)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        vin_id: vinId,
        full_name: fullName,
        display_name: displayName,
        first_name: first_name.trim(),
        middle_name: middle_name?.trim() || null,
        last_name: last_name.trim(),
        email: email,
        role: role,
        role_id: `${role}_${email}`,
        class: studentClass || null,
        department: department || 'General',
        admission_year: year,
        phone: phone || null,
        address: address || null,
        is_active: true,
        password_changed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    
    if (profileError) {
      console.error('❌ Profile insert error:', profileError)
      // Rollback: delete auth user if profile fails
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }
    
    console.log('✅ Profile created:', { displayName, vin_id: vinId })
    
    // STEP 3: Insert into users (ONLY the 7 columns that exist)
    try {
      const { error: userError } = await supabaseAdmin
        .from('users')
        .insert({
          id: userId,
          auth_id: userId,
          vin_id: vinId,
          email: email,
          role: role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      
      if (userError) {
        console.warn('⚠️ User table insert error (non-critical):', userError)
      } else {
        console.log('✅ User record created')
      }
    } catch (userTableError: any) {
      console.warn('⚠️ User table error (skipping):', userTableError.message)
    }
    
    // ✅ Return credentials to frontend
    return NextResponse.json({ 
      success: true, 
      user: { 
        id: userId, 
        email: email, 
        full_name: fullName,
        display_name: displayName,
        vin_id: vinId,
        role: role
      },
      credentials: {
        email: email,
        password: vinId,
        vin_id: vinId
      }
    })
    
  } catch (error: any) {
    console.error('❌ Error creating user:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 })
  }
}