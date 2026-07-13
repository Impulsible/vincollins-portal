// app/api/admin/promotions/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get all promotions with student data from profiles
    const { data: promotions, error } = await supabase
      .from('pending_promotions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: error.message, promotions: [] },
        { status: 500 }
      )
    }

    if (!promotions || promotions.length === 0) {
      return NextResponse.json({ promotions: [] })
    }

    // Get all student IDs from promotions
    const studentIds = promotions.map(p => p.student_id).filter(id => id)
    
    // Fetch student data from profiles table
    let studentData: Record<string, any> = {}
    
    if (studentIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, full_name, class, avatar_url, photo_url')
        .in('id', studentIds)

      if (!profilesError && profiles) {
        studentData = profiles.reduce((acc, profile) => {
          acc[profile.id] = {
            display_name: profile.display_name || profile.full_name || 'Unknown Student',
            class: profile.class || 'Unknown',
            avatar_url: profile.avatar_url || null,
            photo_url: profile.photo_url || null
          }
          return acc
        }, {} as Record<string, any>)
      }
    }

    // Format the data
    const formattedPromotions = promotions.map((p: any) => {
      const student = studentData[p.student_id] || {}
      const imageUrl = student.avatar_url || student.photo_url || null
      
      return {
        id: p.id,
        student_id: p.student_id,
        student_name: student.display_name || p.student_name || 'Unknown Student',
        current_class: student.class || p.current_class || 'Unknown',
        next_class: p.next_class || 'Unknown',
        status: p.status || 'pending',
        department_choice: p.chosen_department || null,
        created_at: p.created_at,
        avatar_url: imageUrl,
        photo_url: imageUrl,
        profile_image: imageUrl
      }
    })

    return NextResponse.json({ promotions: formattedPromotions })

  } catch (error: any) {
    console.error('Error fetching promotions:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch promotions', promotions: [] },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { student_id, action, department } = await request.json()

    if (!student_id || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (action === 'approve') {
      // ============================================
      // STEP 1: Get the promotion details
      // ============================================
      const { data: promotion, error: promoError } = await supabase
        .from('pending_promotions')
        .select('*')
        .eq('student_id', student_id)
        .eq('status', 'pending')
        .single()

      if (promoError || !promotion) {
        return NextResponse.json(
          { error: 'No pending promotion found for this student' },
          { status: 404 }
        )
      }

      // ============================================
      // STEP 2: Update the promotion status
      // ============================================
      const { error: updatePromoError } = await supabase
        .from('pending_promotions')
        .update({ 
          status: 'approved',
          chosen_department: department || null,
          updated_at: new Date().toISOString()
        })
        .eq('student_id', student_id)
        .eq('status', 'pending')

      if (updatePromoError) {
        console.error('Update promotion error:', updatePromoError)
        return NextResponse.json(
          { error: updatePromoError.message || 'Failed to update promotion' },
          { status: 500 }
        )
      }

      // ============================================
      // STEP 3: UPDATE THE PROFILE - THIS IS KEY!
      // Updates the student in the profiles table
      // ============================================
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({ 
          class: promotion.next_class,
          current_term: 'first',
          current_session: '2026/2027',
          subject_count: promotion.next_class.includes('SS') ? 10 : 17,
          updated_at: new Date().toISOString()
        })
        .eq('id', student_id)

      if (updateProfileError) {
        console.error('Update profile error:', updateProfileError)
        return NextResponse.json(
          { error: updateProfileError.message || 'Failed to update student class' },
          { status: 500 }
        )
      }

      // ============================================
      // STEP 4: Add promotion history to profile
      // ============================================
      // Get current promotion history
      const { data: profile } = await supabase
        .from('profiles')
        .select('promotion_history')
        .eq('id', student_id)
        .single()

      let currentHistory = profile?.promotion_history || []
      if (typeof currentHistory === 'string') {
        try {
          currentHistory = JSON.parse(currentHistory)
        } catch {
          currentHistory = []
        }
      }

      const updatedHistory = [
        ...(Array.isArray(currentHistory) ? currentHistory : []),
        {
          from_class: promotion.current_class,
          to_class: promotion.next_class,
          term: 'third',
          session: '2025/2026',
          department: department || null,
          promoted_at: new Date().toISOString()
        }
      ]

      await supabase
        .from('profiles')
        .update({
          promotion_history: updatedHistory
        })
        .eq('id', student_id)

      // ============================================
      // STEP 5: Update exam attempts with new class
      // ============================================
      await supabase
        .from('exam_attempts')
        .update({ 
          student_class: promotion.next_class,
          updated_at: new Date().toISOString()
        })
        .eq('student_id', student_id)

      // ============================================
      // STEP 6: Update attendance with new class
      // ============================================
      await supabase
        .from('attendance')
        .update({ 
          student_class: promotion.next_class,
          updated_at: new Date().toISOString()
        })
        .eq('student_id', student_id)

      // ============================================
      // STEP 7: Create notification
      // ============================================
      await supabase
        .from('notifications')
        .insert({
          title: `🎓 ${promotion.student_name} Promoted`,
          message: `${promotion.student_name} promoted from ${promotion.current_class} to ${promotion.next_class}`,
          type: 'promotion',
          status: 'unread',
          created_at: new Date().toISOString()
        })

      return NextResponse.json({
        success: true,
        message: `✅ ${promotion.student_name} promoted from ${promotion.current_class} to ${promotion.next_class}`,
        data: {
          student_id: student_id,
          previous_class: promotion.current_class,
          new_class: promotion.next_class
        }
      })

    } else if (action === 'reject') {
      // ============================================
      // Reject promotion - keep student in current class
      // ============================================
      const { data, error } = await supabase
        .from('pending_promotions')
        .update({ 
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('student_id', student_id)
        .eq('status', 'pending')
        .select()

      if (error) {
        console.error('Reject error:', error)
        return NextResponse.json(
          { error: error.message || 'Failed to reject promotion' },
          { status: 500 }
        )
      }

      if (!data || data.length === 0) {
        return NextResponse.json(
          { error: 'No pending promotion found for this student' },
          { status: 404 }
        )
      }

      // Get student name for notification
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', student_id)
        .single()

      await supabase
        .from('notifications')
        .insert({
          title: `❌ Promotion Rejected`,
          message: `${profile?.display_name || 'Student'}'s promotion has been rejected.`,
          type: 'promotion',
          status: 'unread',
          created_at: new Date().toISOString()
        })

      return NextResponse.json({
        success: true,
        message: 'Promotion rejected successfully'
      })

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "approve" or "reject"' },
        { status: 400 }
      )
    }

  } catch (error: any) {
    console.error('Error processing promotion:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process promotion' },
      { status: 500 }
    )
  }
}