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
  
  let baseEmail = `${sanitizedFirst}.${sanitizedLast}@vincollins.edu.ng`
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
  let roleId: string
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
  
  return roleId || `${prefix}-${secureRandomNumber(6)}`
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()
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

// Keep the GET, PUT, DELETE functions from before...