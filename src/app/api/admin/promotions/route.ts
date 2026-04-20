// app/api/admin/promotions/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'admin' && profile?.role !== 'staff') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    // Get pending promotions
    const { data, error } = await supabase
      .from('pending_promotions')
      .select(`
        id,
        student_id,
        current_class,
        next_class,
        status,
        created_at
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    // Get student names from profiles
    const promotionsWithNames = await Promise.all(
      (data || []).map(async (promo) => {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', promo.student_id)
          .single()
        
        return {
          ...promo,
          student_name: profileData?.full_name || 'Unknown Student'
        }
      })
    )
    
    return NextResponse.json({ promotions: promotionsWithNames })
    
  } catch (error: any) {
    console.error('Error fetching promotions:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'admin' && profile?.role !== 'staff') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    const { student_id, department, action } = await request.json()
    
    if (!student_id || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    if (action === 'approve') {
      if (!department) {
        return NextResponse.json({ error: 'Department is required for approval' }, { status: 400 })
      }
      
      // Call the approve_promotion function
      const { error } = await supabase.rpc('approve_promotion', {
        student_id,
        department_choice: department
      })
      
      if (error) throw error
      
      return NextResponse.json({ success: true, message: 'Promotion approved' })
      
    } else if (action === 'reject') {
      // Call the reject_promotion function
      const { error } = await supabase.rpc('reject_promotion', { 
        student_id 
      })
      
      if (error) throw error
      
      return NextResponse.json({ success: true, message: 'Promotion rejected' })
      
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    
  } catch (error: any) {
    console.error('Error processing promotion:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}