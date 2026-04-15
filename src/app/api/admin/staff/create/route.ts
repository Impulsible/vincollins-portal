/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Helper to get Supabase client at runtime
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, serviceRoleKey)
}

export async function POST(req: NextRequest) {
  try {
    // Create client at runtime, not at module level
    const supabaseAdmin = getSupabaseAdmin()
    
    const body = await req.json()
    const { 
      email, password, full_name, first_name, last_name, 
      role, department, join_year, phone, address, vin_id 
    } = body
    
    console.log('📧 Creating staff:', { email, role, full_name, vin_id })
    
    // ✅ STEP 1: Create user with Admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        email: email,
        full_name: full_name,
        first_name: first_name,
        last_name: last_name,
        role: role,
        department: department,
        join_year: join_year,
        phone: phone,
        address: address,
        vin_id: vin_id
      }
    })
    
    if (authError) {
      console.error('❌ Auth creation error:', authError)
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }
    
    const userId = authData.user.id
    console.log('✅ Auth user created:', userId)
    
    // ✅ STEP 2: Insert into profiles table
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        vin_id: vin_id,
        full_name: full_name,
        first_name: first_name,
        last_name: last_name,
        email: email,
        role: role,
        role_id: `${role}_${email}`,
        department: department || 'General',
        join_year: join_year,
        phone: phone || null,
        address: address || null,
        is_active: true,
        password_changed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    
    if (profileError) {
      console.error('❌ Profile insert error:', profileError)
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }
    
    console.log('✅ Profile created with VIN:', vin_id)
    
    // ✅ STEP 3: Insert into users table
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        auth_id: userId,
        vin_id: vin_id,
        email: email,
        full_name: full_name,
        first_name: first_name,
        last_name: last_name,
        role: role,
        department: department || 'General',
        join_year: join_year,
        phone: phone || null,
        address: address || null,
        is_active: true,
        password_changed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    
    if (userError) {
      console.error('❌ User table insert error:', userError)
    } else {
      console.log('✅ User record created with VIN:', vin_id)
    }
    
    return NextResponse.json({ 
      success: true, 
      user: { 
        id: userId, 
        email: email, 
        full_name: full_name,
        password: password,
        vin_id: vin_id
      }
    })
    
  } catch (error: any) {
    console.error('❌ Error creating staff:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}