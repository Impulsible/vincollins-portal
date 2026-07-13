// app/api/admin/system-status/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get current settings
    const { data: settings, error } = await supabase
      .from('school_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      return NextResponse.json({
        error: 'School settings not configured',
        settings: null,
        canProcessPromotions: false,
        message: 'System not initialized'
      })
    }

    // Check if promotions can be processed
    const canProcess = settings.current_term === 'third' && 
                      settings.promotion_status !== 'completed'

    // Get student count
    const { count: totalStudents } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })

    // Get pending promotions count
    const { count: pendingPromotions } = await supabase
      .from('pending_promotions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    // Get students by class
    const { data: students } = await supabase
      .from('students')
      .select('class')
    
    const classCounts: Record<string, number> = {}
    students?.forEach((s: any) => {
      classCounts[s.class] = (classCounts[s.class] || 0) + 1
    })

    return NextResponse.json({
      settings: {
        currentTerm: settings.current_term,
        currentSession: settings.current_session,
        promotionStatus: settings.promotion_status,
        promotionDate: settings.promotion_date,
        academicYearStart: settings.academic_year_start,
        academicYearEnd: settings.academic_year_end,
        termStart: settings.term_start_date,
        termEnd: settings.term_end_date,
        nextTermBegins: settings.next_term_begins
      },
      stats: {
        totalStudents: totalStudents || 0,
        pendingPromotions: pendingPromotions || 0,
        classCounts: Object.entries(classCounts).map(([class_, count]) => ({ class_, count }))
      },
      canProcessPromotions: canProcess,
      message: canProcess 
        ? '✅ Ready to process end of session promotions!' 
        : settings.current_term !== 'third' 
          ? `⏳ End of session promotions only in third term. Current: ${settings.current_term}`
          : settings.promotion_status === 'completed'
            ? '✅ Promotions already completed for this session'
            : '⏳ System is ready'
    })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed to get system status' },
      { status: 500 }
    )
  }
}