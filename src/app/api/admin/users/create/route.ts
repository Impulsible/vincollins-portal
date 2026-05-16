/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/admin/users/create/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  console.log('📦 API called: Create User')
  
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const body = await req.json()
    console.log('📦 Received body:', JSON.stringify(body, null, 2))
    
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
      admission_number,
      gender,
      date_of_birth,
      next_term_begins,
      join_year 
    } = body
    
    // Validate
    if (!first_name || !last_name || !role) {
      console.error('❌ Missing required fields:', { first_name, last_name, role })
      return NextResponse.json({ 
        error: 'First name, last name, and role are required' 
      }, { status: 400 })
    }
    
    // ✅ Helper function to capitalize words
    const capitalizeWords = (str: string): string => {
      return str
        .split(' ')
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ')
    }
    
    // ✅ Generate credentials - Email stays as firstname.lastname
    const sanitizedFirst = first_name.toLowerCase().replace(/[^a-z]/g, '').substring(0, 15) || 'user'
    const sanitizedLast = last_name.toLowerCase().replace(/[^a-z]/g, '').substring(0, 15) || 'account'
    const email = `${sanitizedFirst}.${sanitizedLast}@vincollins.edu.ng`
    
    const year = admission_year || join_year || new Date().getFullYear()
    const randomNum = Math.floor(Math.random() * 9000) + 1000
    
    const prefixes: Record<string, string> = {
      admin: 'VIN-ADM',
      staff: 'VIN-STF',
      student: 'VIN-STD'
    }
    const prefix = prefixes[role] || 'VIN-STD'
    const vin_id = `${prefix}-${year}-${randomNum}`
    
    // ✅ Build both full_name and display_name: "Last First Middle" (e.g., "Yusuf Laila Zainab")
    let fullName = last_name.trim() + ' ' + first_name.trim()
    if (middle_name && middle_name.trim()) {
      fullName += ' ' + middle_name.trim()
    }
    fullName = capitalizeWords(fullName)
    
    // ✅ display_name is the same as full_name (Surname First Other)
    const displayName = fullName
    
    console.log('📧 Creating user:', { email, vin_id, fullName, displayName, role })
    console.log('📋 Additional fields:', { 
      gender, 
      date_of_birth, 
      next_term_begins, 
      admission_number,
      middle_name 
    })
    
    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: vin_id,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        display_name: displayName,
        first_name: capitalizeWords(first_name.trim()),
        middle_name: middle_name?.trim() ? capitalizeWords(middle_name.trim()) : '',
        last_name: capitalizeWords(last_name.trim()),
        role: role,
        vin_id: vin_id
      }
    })
    
    if (authError) {
      console.error('❌ Auth error:', authError)
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }
    
    const userId = authData.user.id
    console.log('✅ Auth user created:', userId)
    
    // Step 2: Insert into profiles with ALL fields
    const profileInsert: any = {
      id: userId,
      vin_id: vin_id,
      full_name: fullName,          // ✅ "Soga Esther Olamide" (Surname First Other)
      display_name: displayName,    // ✅ "Soga Esther Olamide" (Same format)
      first_name: capitalizeWords(first_name.trim()),
      last_name: capitalizeWords(last_name.trim()),
      email: email,
      role: role,
      department: department || 'General',
      phone: phone || null,
      address: address || null,
      is_active: true,
      password_changed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // ✅ Optional fields - only add if they have values
    if (middle_name?.trim()) {
      profileInsert.middle_name = capitalizeWords(middle_name.trim())
    }
    if (role === 'student' && studentClass) {
      profileInsert.class = studentClass
    }
    if (admission_year) {
      profileInsert.admission_year = admission_year
    }
    if (join_year) {
      profileInsert.join_year = join_year
    }
    
    // ✅ NEW FIELDS
    if (admission_number?.trim()) {
      profileInsert.admission_number = admission_number.trim()
    }
    if (gender) {
      profileInsert.gender = gender
    }
    if (date_of_birth) {
      profileInsert.date_of_birth = date_of_birth
    }
    if (next_term_begins) {
      profileInsert.next_term_begins = next_term_begins
    }

    console.log('💾 Profile insert data:', JSON.stringify(profileInsert, null, 2))

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert(profileInsert)
      .select()
      .single()
    
    if (profileError) {
      console.error('❌ Profile insert failed:', profileError)
      console.error('Error details:', profileError.message, profileError.details, profileError.hint)
      
      // ✅ ROLLBACK: Delete the auth user since profile creation failed
      await supabaseAdmin.auth.admin.deleteUser(userId)
      console.log('🔄 Rolled back auth user')
      
      return NextResponse.json({ 
        error: `Failed to create profile: ${profileError.message}`,
        details: profileError.details 
      }, { status: 500 })
    }
    
    console.log('✅ Profile created:', profile?.id, profile?.full_name, profile?.display_name)
    
    // Step 3: Insert into users table (optional)
    try {
      await supabaseAdmin
        .from('users')
        .insert({
          id: userId,
          auth_id: userId,
          vin_id: vin_id,
          email: email,
          role: role,
          admission_number: admission_number?.trim() || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      console.log('✅ Users table updated')
    } catch (e: any) {
      console.log('⚠️ Users table (skipped):', e.message)
    }
    
    // Success!
    return NextResponse.json({ 
      success: true, 
      user: { 
        id: userId, 
        email: email, 
        full_name: fullName,
        display_name: displayName,
        vin_id: vin_id,
        role: role,
        admission_number: admission_number?.trim() || '',
        gender: gender || null,
        class: studentClass || null,
        department: department || 'General',
      },
      credentials: {
        email: email,
        password: vin_id,
        vin_id: vin_id,
        admission_number: admission_number?.trim() || '',
      }
    })
    
  } catch (error: any) {
    console.error('❌ API FATAL ERROR:', error)
    console.error('Stack:', error.stack)
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 })
  }
}