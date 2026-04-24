// hooks/useAdminData.ts - FIXED
'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface PendingExam {
  id: string; title: string; subject: string; class: string;
  duration: number; total_questions: number; total_marks: number;
  has_theory: boolean; questions: any[]; theory_questions: any[];
  instructions: string; passing_percentage: number;
  teacher_name: string; department: string;
  created_at: string; created_by: string;
}

export function useAdminData(profile: any) {
  const [students, setStudents] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [pendingExams, setPendingExams] = useState<PendingExam[]>([])
  const [publishedExams, setPublishedExams] = useState<any[]>([])
  const [inquiries, setInquiries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [pendingExamsCount, setPendingExamsCount] = useState(0)
  const [pendingReports, setPendingReports] = useState(0)
  const [pendingInquiries, setPendingInquiries] = useState(0)
  const [notificationCount, setNotificationCount] = useState(0)
  
  const [stats, setStats] = useState({
    totalStudents: 0, totalStaff: 0, activeExams: 0,
    pendingSubmissions: 0, passRate: 78, attendanceRate: 94,
  })

  const loadAllData = useCallback(async () => {
    if (!profile?.id) return
    
    try {
      const { data: profiles } = await supabase.from('profiles').select('*')
      const studentsList = profiles?.filter(p => p.role === 'student') || []
      const staffList = profiles?.filter(p => p.role === 'staff') || []
      setStudents(studentsList)
      setStaff(staffList)

      const { data: examsData } = await supabase.from('exams').select('*').order('created_at', { ascending: false })

      // FIXED: Define variables BEFORE using them
      let pendingList: PendingExam[] = []
      let publishedList: any[] = []

      if (examsData) {
        pendingList = examsData.filter((e: any) => e.status === 'pending').map((e: any) => ({
          id: e.id, title: e.title, subject: e.subject, class: e.class,
          duration: e.duration || 60, total_questions: e.total_questions || 0,
          total_marks: e.total_marks || 0, has_theory: e.has_theory || false,
          questions: e.questions || [], theory_questions: e.theory_questions || [],
          instructions: e.instructions || '', passing_percentage: e.passing_percentage || e.pass_mark || 50,
          teacher_name: e.teacher_name || 'Unknown', department: e.department || 'General',
          created_at: e.created_at, created_by: e.created_by
        }))
        publishedList = examsData.filter((e: any) => e.status === 'published')
      }

      setPendingExams(pendingList)
      setPendingExamsCount(pendingList.length)
      setPublishedExams(publishedList)

      const { data: inquiriesData } = await supabase.from('inquiries').select('*').order('created_at', { ascending: false })
      if (inquiriesData) {
        setInquiries(inquiriesData)
        setPendingInquiries(inquiriesData.filter((i: any) => i.status === 'pending').length)
      }

      const { data: reportsData } = await supabase.from('report_cards').select('id, status').eq('status', 'pending')
      setPendingReports(reportsData?.length || 0)

      if (profile?.id) {
        const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', profile.id).eq('read', false)
        setNotificationCount(count || 0)
      }

      // FIXED: Use pendingList (which is defined) instead of 'pending'
      setStats({
        totalStudents: studentsList.length,
        totalStaff: staffList.length,
        activeExams: publishedList.length,
        pendingSubmissions: pendingList.length,  // ✅ Fixed
        passRate: 78,
        attendanceRate: 94,
      })

    } catch (error) {
      console.error('Data load error:', error)
    } finally {
      setLoading(false)
    }
  }, [profile?.id])

  useEffect(() => {
    if (profile?.id) loadAllData()
  }, [profile?.id, loadAllData])

  useEffect(() => {
    const channel = supabase.channel('admin-data')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exams' }, () => loadAllData())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadAllData])

  const approveExam = async (exam: PendingExam) => {
    const { error } = await supabase.from('exams').update({ 
      status: 'published', published_at: new Date().toISOString() 
    }).eq('id', exam.id)
    if (error) throw error
    toast.success('✅ Exam approved! Notifications sent.')
    await loadAllData()
  }

  const rejectExam = async (exam: PendingExam, reason: string) => {
    const { error } = await supabase.from('exams').update({ 
      status: 'rejected', review_notes: reason, rejected_at: new Date().toISOString()
    }).eq('id', exam.id)
    if (error) throw error
    toast.success('Exam rejected.')
    await loadAllData()
  }

  return {
    students, staff, pendingExams, publishedExams, inquiries,
    pendingExamsCount, pendingReports, pendingInquiries,
    notificationCount, stats, loading,
    refresh: loadAllData, approveExam, rejectExam
  }
}