// app/api/admin/users/update/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function PUT(req: NextRequest) {
  console.log('📦 API called: Update User')
  
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const body = await req.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    console.log('🔄 Updating user:', id)
    console.log('📋 Update data:', updateData)
    
    // Update profiles table using admin client (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('❌ Update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log('✅ User updated successfully:', data)
    
    return NextResponse.json({ 
      success: true, 
      user: data 
    })
    
  } catch (error: any) {
    console.error('❌ API FATAL ERROR:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 })
  }
}