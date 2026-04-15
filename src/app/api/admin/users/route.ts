/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Helper function to generate secure random number
function secureRandomNumber(length: number = 6): string {
  return Math.floor(Math.random() * Math.pow(10, length)).toString().padStart(length, '0')
}

// Helper function to generate unique email
async function generateUniqueEmail(firstName: string, lastName: string, supabase: any): Promise<string> {
  const sanitizedFirst = firstName.toLowerCase().replace(/[^a-z]/g, '').substring(0, 5)
  const sanitizedLast = lastName.toLowerCase().replace(/[^a-z]/g, '').substring(0, 5)
  
  const baseEmail = `${sanitizedFirst}.${sanitizedLast}@vincollins.edu.ng`
  let finalEmail = baseEmail
  let counter = 1
  
  while (true) {
    const { data } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', finalEmail)
      .single()
    
    if (!data) return finalEmail
    
    const randomSuffix = secureRandomNumber(3)
    finalEmail = `${sanitizedFirst}.${sanitizedLast}${randomSuffix}@vincollins.edu.ng`
    counter++
    
    if (counter > 100) {
      finalEmail = `${sanitizedFirst}.${sanitizedLast}${Date.now()}@vincollins.edu.ng`
      return finalEmail
    }
  }
}

// Helper function to generate secure password
function generateSecurePassword(role: string): string {
  const prefixes: Record<string, string> = {
    admin: 'VIN-ADM',
    staff: 'VIN-STF',
    student: 'VIN-STU'
  }
  
  const prefix = prefixes[role] || 'VIN-STU'
  const randomNum = secureRandomNumber(6)
  const specialChars = ['!', '@', '#', '$', '%', '&', '*']
  const randomSpecial = specialChars[Math.floor(Math.random() * specialChars.length)]
  
  return `${prefix}-${randomNum}${randomSpecial}`
}

// Helper function to generate role ID
async function generateRoleId(role: string, supabase: any): Promise<string> {
  const prefixes: Record<string, string> = {
    admin: 'VIN-ADM',
    staff: 'VIN-STF',
    student: 'VIN-STU'
  }
  
  const prefix = prefixes[role]
  // ✅ Initialize roleId with a default value
  let roleId: string = `${prefix}-${secureRandomNumber(6)}`
  let exists = true
  let attempts = 0
  
  while (exists && attempts < 50) {
    const randomNum = secureRandomNumber(6)
    roleId = `${prefix}-${randomNum}`
    
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('role_id', roleId)
      .single()
    
    exists = !!data
    attempts++
  }
  
  return roleId
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient() // ✅ Add await here
    const body = await request.json()
    const { first_name, last_name, role, class: userClass, department, phone, address } = body
    
    // Validate required fields
    if (!first_name || !last_name) {
      return NextResponse.json({ error: 'First name and last name are required' }, { status: 400 })
    }
    
    // Generate credentials
    const email = await generateUniqueEmail(first_name, last_name, supabase)
    const tempPassword = generateSecurePassword(role)
    const roleId = await generateRoleId(role, supabase)
    const fullName = `${first_name} ${last_name}`
    
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role
      }
    })
    
    if (authError) throw authError
    
    // Create profile
    const profileData: any = {
      id: authData.user.id,
      full_name: fullName,
      first_name,
      last_name,
      email,
      role,
      role_id: roleId,
      temp_password: tempPassword,
      password_changed: false,
      is_active: true,
      phone: phone || null,
      address: address || null
    }
    
    // Add role-specific fields
    if (role === 'student') {
      profileData.class = userClass || getRandomClass()
    } else if (role === 'staff') {
      profileData.department = department || getRandomDepartment()
    }
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single()
    
    if (profileError) throw profileError
    
    return NextResponse.json({ 
      success: true, 
      user: profile,
      temp_password: tempPassword 
    })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}

// Helper functions
function getRandomClass(): string {
  const classes = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3']
  return classes[Math.floor(Math.random() * classes.length)]
}

function getRandomDepartment(): string {
  const departments = ['Science', 'Arts', 'Mathematics', 'Languages', 'Social Sciences', 'Vocational Studies']
  return departments[Math.floor(Math.random() * departments.length)]
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient() // ✅ Add await here
    
    const { data: users, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient() // ✅ Add await here
    const { id, ...updates } = await request.json()
    
    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ success: true, user: data })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient() // ✅ Add await here
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    // Soft delete
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: false, deleted_at: new Date().toISOString() })
      .eq('id', id)
    
    if (error) throw error
    
    return NextResponse.json({ success: true, message: 'User deactivated successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}