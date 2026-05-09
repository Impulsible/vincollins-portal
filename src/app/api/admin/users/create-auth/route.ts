// app/api/admin/users/create-auth/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { id, email, password, name } = await req.json()

    console.log('🔧 Creating auth user for:', { id, email, name })

    // Check if auth user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.getUserById(id)
    
    if (existingUser?.user) {
      return NextResponse.json({ 
        success: true, 
        message: 'Auth user already exists' 
      })
    }

    // Get profile data
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (!profile) {
      return NextResponse.json({ 
        error: 'Profile not found' 
      }, { status: 404 })
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: profile.full_name,
        first_name: profile.first_name,
        last_name: profile.last_name,
        role: profile.role,
        vin_id: profile.vin_id
      }
    })

    if (authError) {
      console.error('❌ Auth creation error:', authError)
      return NextResponse.json({ 
        error: authError.message 
      }, { status: 500 })
    }

    // Update the profile ID to match the new auth user (if different)
    if (authData.user.id !== id) {
      await supabaseAdmin
        .from('profiles')
        .update({ 
          id: authData.user.id,
          old_id: id 
        })
        .eq('id', id)

      // Also update users table
      await supabaseAdmin
        .from('users')
        .update({ id: authData.user.id })
        .eq('id', id)
    }

    console.log('✅ Auth user created:', authData.user.id)

    return NextResponse.json({ 
      success: true, 
      userId: authData.user.id 
    })

  } catch (error: any) {
    console.error('❌ Error:', error)
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 })
  }
}