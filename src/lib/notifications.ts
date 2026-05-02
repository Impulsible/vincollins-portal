// src/lib/notifications.ts
import { supabase } from '@/lib/supabase'

interface CreateNotificationParams {
  userId: string
  title: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  link?: string
}

export async function createNotification({ userId, title, message, type = 'info', link }: CreateNotificationParams) {
  try {
    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      title,
      message,
      type,
      link,
      read: false
    })
    if (error) console.error('Notification error:', error)
  } catch (error) {
    console.error('Failed to create notification:', error)
  }
}

export const notify = {
  async newSubmission(examId: string, examTitle: string, studentName: string, teacherId: string) {
    await createNotification({
      userId: teacherId,
      title: '📝 New Submission',
      message: `${studentName} submitted ${examTitle}`,
      type: 'info',
      link: `/staff/exams/${examId}/submissions`
    })
  },

  async theoryPending(examId: string, examTitle: string, studentName: string, teacherId: string) {
    await createNotification({
      userId: teacherId,
      title: '✏️ Theory Ready for Grading',
      message: `${studentName}'s theory answers for ${examTitle} need grading`,
      type: 'warning',
      link: `/staff/exams/${examId}/submissions?tab=pending_theory`
    })
  },

  async theoryGraded(examId: string, examTitle: string, studentName: string, score: number, percentage: number, teacherId: string) {
    await createNotification({
      userId: teacherId,
      title: '✅ Theory Graded',
      message: `${studentName} scored ${score}/40 in ${examTitle} theory (${percentage}%)`,
      type: 'success',
      link: `/staff/exams/${examId}/submissions?tab=graded`
    })
  },

  async lowScore(examId: string, examTitle: string, studentName: string, percentage: number, grade: string, teacherId: string) {
    if (percentage < 50) {
      await createNotification({
        userId: teacherId,
        title: '⚠️ Low Score Alert',
        message: `${studentName} scored ${percentage}% (${grade}) in ${examTitle}`,
        type: 'error',
        link: `/staff/exams/${examId}/submissions`
      })
    }
  },

  async allGraded(examId: string, examTitle: string, count: number, teacherId: string) {
    await createNotification({
      userId: teacherId,
      title: '🎉 Grading Complete',
      message: `All ${count} submissions for ${examTitle} have been graded`,
      type: 'success',
      link: `/staff/exams/${examId}/submissions?tab=graded`
    })
  }
}

export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false)
    return count || 0
  } catch { return 0 }
}