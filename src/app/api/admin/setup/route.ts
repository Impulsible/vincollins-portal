import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient() // ✅ Add await here
    const { email, password, full_name } = await request.json()
    
    console.log('Attempting to create admin...', { email, full_name })
    
    // Check if any admin exists
    const { data: existingAdmins, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .is('deleted_at', null)
    
    if (checkError) {
      console.error('Error checking existing admins:', checkError)
    }
    
    if (existingAdmins && existingAdmins.length > 0) {
      return NextResponse.json({ error: 'Admin already exists' }, { status: 403 })
    }
    
    // Generate secure role ID
    const generateRoleId = () => {
      const randomNum = Math.floor(Math.random() * 900000 + 100000).toString()
      return `VIN-ADM-${randomNum}`
    }
    
    const roleId = generateRoleId()
    const adminEmail = email || 'admin@vincollins.edu.ng'
    const adminPassword = password || `Admin${Math.floor(Math.random() * 900000 + 100000)}!`
    const adminName = full_name || 'System Administrator'
    
    // First, check if user already exists in auth
    const { data: existingUser } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    }).catch(() => ({ data: null }))
    
    let userId: string
    
    if (existingUser?.user) {
      userId = existingUser.user.id
    } else {
      // Create user in Supabase Auth (this will send confirmation email)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: adminEmail,
        password: adminPassword,
        options: {
          data: {
            full_name: adminName,
            role: 'admin'
          }
        }
      })
      
      if (authError) {
        console.error('Auth error:', authError)
        return NextResponse.json({ error: authError.message }, { status: 500 })
      }
      
      if (!authData.user) {
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
      }
      
      userId = authData.user.id
    }
    
    // Create or update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        full_name: adminName,
        first_name: 'System',
        last_name: 'Admin',
        email: adminEmail,
        role: 'admin',
        role_id: roleId,
        is_active: true,
        password_changed: false
      }, { onConflict: 'id' })
    
    if (profileError) {
      console.error('Profile error:', profileError)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Admin created successfully',
      email: adminEmail,
      role_id: roleId,
      password: adminPassword,
      note: 'Please check your email for confirmation if required'
    })
  } catch (error) {
    console.error('Error creating admin:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to create admin' 
    }, { status: 500 })
  }
}