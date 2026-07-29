// app/api/admin/end-of-term/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()
    
    // Get current settings
    const { data: settings } = await supabase
      .from('school_settings')
      .select('*')
      .single()

    if (!settings) {
      return NextResponse.json(
        { error: 'School settings not found' },
        { status: 404 }
      )
    }

    // Check if it's third term
    if (settings.current_term !== 'third') {
      return NextResponse.json({
        success: false,
        message: `⚠️ End of term promotions can only be processed in third term. Current: ${settings.current_term}`
      })
    }

    // Get all students from profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, class')
      .not('class', 'is', null)

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No students found'
      })
    }

    let promoted = 0
    let skipped = 0

    for (const profile of profiles) {
      const nextClass = getNextClass(profile.class)
      
      if (!nextClass) {
        skipped++
        continue
      }

      // Update profile to new class
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          class: nextClass,
          current_term: 'first',
          current_session: '2026/2027',
          subject_count: nextClass.includes('SS') ? 10 : 17
        })
        .eq('id', profile.id)

      if (!updateError) {
        promoted++
      }
    }

    // Update school settings
    await supabase
      .from('school_settings')
      .update({
        current_term: 'first',
        current_session: '2026/2027',
        promotion_status: 'completed',
        promotion_date: new Date().toISOString()
      })
      .eq('id', settings.id)

    return NextResponse.json({
      success: true,
      message: `✅ ${promoted} students promoted, ${skipped} skipped (final class)`,
      data: { promoted, skipped }
    })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getNextClass(currentClass: string): string | undefined {
  if (!currentClass) return undefined
  
  const normalized = currentClass.trim()
  
  if (normalized === 'SS 3' || normalized === 'SS3') {
    return undefined
  }
  
  const classMapping: Record<string, string> = {
    'JSS 1': 'JSS 2',
    'JSS1': 'JSS 2',
    'JSS 2': 'JSS 3',
    'JSS2': 'JSS 3',
    'JSS 3': 'SS 1',
    'JSS3': 'SS 1',
    'SS 1': 'SS 2',
    'SS1': 'SS 2',
    'SS 2': 'SS 3',
    'SS2': 'SS 3'
  }
  
  return classMapping[normalized]
}