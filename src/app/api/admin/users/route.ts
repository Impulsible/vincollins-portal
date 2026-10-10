// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  console.log('📦 API called: List Users')
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { searchParams } = new URL(req.url)
    const role = searchParams.get('role')   // ?role=student
    const cls = searchParams.get('class')   // ?class=SS1 Science
    const active = searchParams.get('is_active') // ?is_active=true
    const q = searchParams.get('q')         // ?q=john (search name/email/vin)
    const limit = Math.min(Number(searchParams.get('limit') ?? 100), 500)

    let query = supabaseAdmin
      .from('profiles')
      .select(
        'id,vin_id,full_name,display_name,email,role,class,department,' +
        'phone,admission_number,gender,is_active,created_at,updated_at'
      )
      .order('full_name', { ascending: true }) // Sort alphabetically
      .limit(limit)

    if (role) query = query.eq('role', role)
    if (cls) query = query.eq('class', cls)
    
    // Strict active state handling
    if (active === 'true' || active === 'false') {
      query = query.eq('is_active', active === 'true')
    }
    
    if (q) {
      query = query.or(
        `full_name.ilike.%${q}%,email.ilike.%${q}%,vin_id.ilike.%${q}%,admission_number.ilike.%${q}%`
      )
    }

    const { data, error } = await query
    if (error) {
      console.error('❌ List error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, count: data?.length ?? 0, users: data })
  } catch (error: any) {
    console.error('❌ API FATAL ERROR:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}