// hooks/useReportCardStatus.ts
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useReportCardStatus(studentId?: string) {
  const [reportCardStatus, setReportCardStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStatus = async () => {
      if (!studentId) {
        setLoading(false)
        return
      }

      try {
        const { data } = await supabase
          .from('report_cards')
          .select('*')
          .eq('student_id', studentId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        setReportCardStatus(data)
      } catch (error) {
        // No report card found - this is normal
        setReportCardStatus(null)
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
  }, [studentId])

  return { reportCardStatus, loading }
}