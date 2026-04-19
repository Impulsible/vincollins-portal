import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST - Start or update session
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { 
      exam_id, 
      student_id, 
      action,
      proctoring_data,
      violation,
      current_question,
      questions_answered,
      tab_switches,
      network_quality,
      ip_address,
      device_info
    } = body

    // Get or create session
    let sessionId: string
    
    const { data: existingSession } = await supabase
      .from('exam_sessions')
      .select('id, violations, warnings, tab_switches, status')
      .eq('exam_id', exam_id)
      .eq('student_id', student_id)
      .eq('status', 'active')
      .maybeSingle()

    if (existingSession) {
      sessionId = existingSession.id
      
      // Prepare update data
      const updateData: any = {
        last_activity: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      if (proctoring_data) {
        updateData.proctoring_data = proctoring_data
      }
      
      if (current_question !== undefined) {
        updateData.current_question = current_question
      }
      
      if (questions_answered !== undefined) {
        updateData.questions_answered = questions_answered
      }
      
      if (network_quality) {
        updateData.network_quality = network_quality
      }
      
      if (ip_address) {
        updateData.ip_address = ip_address
      }
      
      if (device_info) {
        updateData.device_info = device_info
      }

      // Handle tab switches
      if (tab_switches !== undefined) {
        updateData.tab_switches = tab_switches
        
        // Auto-violation for excessive tab switches
        const examData = await supabase
          .from('exams')
          .select('tab_switch_limit')
          .eq('id', exam_id)
          .single()
        
        const limit = examData.data?.tab_switch_limit || 2
        
        if (tab_switches > limit) {
          const violations = existingSession.violations || []
          violations.push({
            type: 'tab_switch_limit',
            message: `Exceeded tab switch limit (${tab_switches}/${limit})`,
            timestamp: new Date().toISOString()
          })
          updateData.violations = violations
          updateData.status = 'violation'
        }
      }

      // Handle new violation
      if (violation) {
        const violations = existingSession.violations || []
        violations.push({
          ...violation,
          timestamp: new Date().toISOString()
        })
        updateData.violations = violations
        
        // Auto-escalate based on violation count
        if (violations.length >= 3) {
          updateData.status = 'violation'
        } else if (violations.length >= 1) {
          updateData.status = 'warning'
        }
      }

      // Handle proctoring alerts
      if (proctoring_data) {
        const violations = existingSession.violations || []
        let hasNewViolation = false
        
        // Face not detected
        if (!proctoring_data.face_detected) {
          violations.push({
            type: 'face_not_detected',
            message: 'Face not detected by camera',
            timestamp: new Date().toISOString()
          })
          hasNewViolation = true
        }
        
        // Multiple faces detected
        if (proctoring_data.multiple_faces) {
          violations.push({
            type: 'multiple_faces',
            message: 'Multiple faces detected',
            timestamp: new Date().toISOString()
          })
          hasNewViolation = true
        }
        
        // Fullscreen violation
        if (!proctoring_data.fullscreen_active) {
          violations.push({
            type: 'fullscreen_violation',
            message: 'Exited fullscreen mode',
            timestamp: new Date().toISOString()
          })
          hasNewViolation = true
        }
        
        if (hasNewViolation) {
          updateData.violations = violations
          updateData.status = violations.length >= 3 ? 'violation' : 'warning'
          updateData.warnings = (existingSession.warnings || 0) + 1
        }
      }

      await supabase
        .from('exam_sessions')
        .update(updateData)
        .eq('id', sessionId)
        
    } else {
      // Create new session
      const { data: newSession, error } = await supabase
        .from('exam_sessions')
        .insert({
          exam_id,
          student_id,
          started_at: new Date().toISOString(),
          status: 'active',
          ip_address,
          device_info,
          network_quality: network_quality || 'good',
          proctoring_data: proctoring_data || {},
          violations: [],
          tab_switches: 0,
          warnings: 0
        })
        .select()
        .single()

      if (error) throw error
      sessionId = newSession.id
    }

    // Get updated session for response
    const { data: session } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    return NextResponse.json({
      success: true,
      session
    })

  } catch (error: any) {
    console.error('Session error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// GET - Get session status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const examId = searchParams.get('exam_id')
    const studentId = searchParams.get('student_id')

    if (!examId || !studentId) {
      return NextResponse.json(
        { error: 'Missing exam_id or student_id' },
        { status: 400 }
      )
    }

    const { data: session } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('exam_id', examId)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    return NextResponse.json({ session })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// PATCH - End session
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { session_id, status, score, percentage_score } = body

    const { error } = await supabase
      .from('exam_sessions')
      .update({
        status,
        ended_at: new Date().toISOString(),
        score,
        percentage_score,
        updated_at: new Date().toISOString()
      })
      .eq('id', session_id)

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}