import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('school_settings')
      .select('*')
      .single()
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching school settings:', error)
    }
    
    const settings = data || {
      logo_path: '/images/logo.png',
      school_name: 'Vincollins College',
      school_motto: 'Geared Towards Success'
    }
    
    return NextResponse.json(settings)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      logo_path: '/images/logo.png',
      school_name: 'Vincollins College',
      school_motto: 'Geared Towards Success'
    })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const body = await request.json()
    
    const { data, error } = await supabase
      .from('school_settings')
      .upsert(body)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}