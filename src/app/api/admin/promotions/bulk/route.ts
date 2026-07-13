// app/api/admin/promotions/bulk/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Fetch all students from profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, display_name, full_name, class')
      .not('class', 'is', null)
      .order('class', { ascending: true })

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return NextResponse.json(
        { error: 'Failed to fetch students: ' + profilesError.message },
        { status: 500 }
      )
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No students found to promote',
        count: 0
      })
    }

    console.log(`📚 Found ${profiles.length} students in profiles`)

    let promotionsCreated = 0
    let alreadyExists = 0
    let skippedFinalClass = 0
    const errors: string[] = []

    for (const profile of profiles) {
      try {
        const nextClass = getNextClass(profile.class)
        
        if (!nextClass) {
          skippedFinalClass++
          console.log(`⏭️ Skipping ${profile.display_name || profile.full_name} - final class: ${profile.class}`)
          continue
        }

        // Check if promotion already exists
        const { data: existing } = await supabase
          .from('pending_promotions')
          .select('id')
          .eq('student_id', profile.id)
          .maybeSingle()

        if (existing) {
          alreadyExists++
          console.log(`⏭️ Skipping ${profile.display_name || profile.full_name} - already has pending promotion`)
          continue
        }

        const studentName = profile.display_name || profile.full_name || 'Unknown Student'
        
        // Create promotion
        const { error: insertError } = await supabase
          .from('pending_promotions')
          .insert({
            student_id: profile.id,
            student_name: studentName,
            current_class: profile.class || 'Unknown',
            next_class: nextClass,
            status: 'pending',
            chosen_department: null,
            created_at: new Date().toISOString(),
            term: 'third',
            session: '2025/2026'
          })

        if (insertError) {
          errors.push(`Failed for ${studentName}: ${insertError.message}`)
          console.error('Insert error:', insertError)
        } else {
          promotionsCreated++
          console.log(`✅ Created promotion for ${studentName}: ${profile.class} → ${nextClass}`)
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error'
        errors.push(`Error processing ${profile.display_name || profile.full_name || profile.id}: ${errorMsg}`)
        console.error('Error processing student:', err)
      }
    }

    const message = `Created ${promotionsCreated} promotions` +
      `${alreadyExists > 0 ? `, ${alreadyExists} already existed` : ''}` +
      `${skippedFinalClass > 0 ? `, ${skippedFinalClass} in final class` : ''}` +
      `${errors.length > 0 ? `, ${errors.length} errors` : ''}`

    return NextResponse.json({
      success: true,
      message,
      count: promotionsCreated,
      alreadyExists,
      skippedFinalClass,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Error creating promotions:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
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