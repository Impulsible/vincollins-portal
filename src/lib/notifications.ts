// src/lib/notifications.ts - COMPLETE THREE-ROLE NOTIFICATION SYSTEM
import { supabase } from '@/lib/supabase'

interface CreateNotificationParams {
  userId: string
  title: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  link?: string
  metadata?: Record<string, any>
}

// ─── Core: Create a single notification ───────────────
export async function createNotification({ userId, title, message, type = 'info', link, metadata }: CreateNotificationParams) {
  try {
    // ✅ Prevent duplicate notifications (same user, type, title in last hour)
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString()
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('type', type)
      .eq('title', title)
      .gte('created_at', oneHourAgo)
      .limit(1)

    if (existing?.length) {
      console.log('⏭️ Duplicate notification skipped:', title)
      return
    }

    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      title,
      message,
      type,
      link: link || '/',
      read: false,
      metadata: metadata || null,
      priority: type === 'error' ? 'high' : type === 'warning' ? 'medium' : 'low',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    if (error) console.error('Notification insert error:', error)
  } catch (error) {
    console.error('Failed to create notification:', error)
  }
}

// ─── Broadcast Helpers ─────────────────────────────────
export async function notifyAllAdmins(title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', link?: string, metadata?: Record<string, any>) {
  try {
    const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin')
    if (!admins?.length) return
    for (const admin of admins) {
      await createNotification({ userId: admin.id, title, message, type, link, metadata })
    }
  } catch (error) { console.error('Failed to notify admins:', error) }
}

export async function notifyAllStaff(title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', link?: string, metadata?: Record<string, any>) {
  try {
    const { data: staff } = await supabase.from('profiles').select('id').eq('role', 'staff')
    if (!staff?.length) return
    for (const s of staff) {
      await createNotification({ userId: s.id, title, message, type, link, metadata })
    }
  } catch (error) { console.error('Failed to notify staff:', error) }
}

export async function notifyStudent(studentId: string, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', link?: string, metadata?: Record<string, any>) {
  await createNotification({ userId: studentId, title, message, type, link, metadata })
}

export async function notifyAllStudents(title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', link?: string, metadata?: Record<string, any>) {
  try {
    const { data: students } = await supabase.from('profiles').select('id').eq('role', 'student')
    if (!students?.length) return
    for (const s of students) {
      await createNotification({ userId: s.id, title, message, type, link, metadata })
    }
  } catch (error) { console.error('Failed to notify students:', error) }
}

export async function notifyClass(className: string, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', link?: string, metadata?: Record<string, any>) {
  try {
    const { data: students } = await supabase.from('profiles').select('id').eq('role', 'student').eq('class', className)
    if (!students?.length) return
    for (const s of students) {
      await createNotification({ userId: s.id, title, message, type, link, metadata })
    }
  } catch (error) { console.error('Failed to notify class:', error) }
}

// ─── TEACHER/STAFF NOTIFICATIONS ───────────────────────
export const notify = {
  async newSubmission(examId: string, examTitle: string, studentName: string, teacherId: string) {
    await createNotification({
      userId: teacherId,
      title: '📝 New Submission',
      message: `${studentName} submitted ${examTitle}`,
      type: 'info',
      link: `/staff/exams/${examId}/submissions`,
      metadata: { exam_id: examId, student: studentName }
    })
  },

  async theoryPending(examId: string, examTitle: string, studentName: string, teacherId: string) {
    await createNotification({
      userId: teacherId,
      title: '✏️ Theory Ready for Grading',
      message: `${studentName}'s theory answers for ${examTitle} need grading`,
      type: 'warning',
      link: `/staff/exams/${examId}/submissions?tab=pending_theory`,
      metadata: { exam_id: examId, student: studentName }
    })
  },

  async theoryGraded(examId: string, examTitle: string, studentName: string, score: number, percentage: number, teacherId: string) {
    await createNotification({
      userId: teacherId,
      title: '✅ Theory Graded',
      message: `${studentName} scored ${score}/40 in ${examTitle} theory (${percentage}%)`,
      type: 'success',
      link: `/staff/exams/${examId}/submissions?tab=graded`,
      metadata: { exam_id: examId, student: studentName, score, percentage }
    })
  },

  async lowScore(examId: string, examTitle: string, studentName: string, percentage: number, grade: string, teacherId: string) {
    if (percentage < 50) {
      await createNotification({
        userId: teacherId,
        title: '⚠️ Low Score Alert',
        message: `${studentName} scored ${percentage}% (${grade}) in ${examTitle}`,
        type: 'error',
        link: `/staff/exams/${examId}/submissions`,
        metadata: { exam_id: examId, student: studentName, percentage, grade }
      })
    }
  },

  async allGraded(examId: string, examTitle: string, count: number, teacherId: string) {
    await createNotification({
      userId: teacherId,
      title: '🎉 Grading Complete',
      message: `All ${count} submissions for ${examTitle} have been graded`,
      type: 'success',
      link: `/staff/exams/${examId}/submissions?tab=graded`,
      metadata: { exam_id: examId, count }
    })
  },

  async reportCardRejected(teacherId: string, studentName: string, reason: string, studentId: string) {
    await createNotification({
      userId: teacherId,
      title: '❌ Report Card Rejected',
      message: `${studentName}'s report card was rejected. Reason: ${reason}`,
      type: 'error',
      link: `/staff/students/${studentId}`,
      metadata: { student_id: studentId, reason }
    })
  },

  async examApproved(teacherId: string, examTitle: string, className: string) {
    await createNotification({
      userId: teacherId,
      title: '✅ Exam Approved!',
      message: `Your exam "${examTitle}" for ${className} has been approved and published.`,
      type: 'success',
      link: '/staff/exams',
      metadata: { exam_title: examTitle, class: className }
    })
  },

  async examRejected(teacherId: string, examTitle: string, reason: string) {
    await createNotification({
      userId: teacherId,
      title: '❌ Exam Returned',
      message: `"${examTitle}" was returned. Reason: ${reason}`,
      type: 'error',
      link: '/staff/exams',
      metadata: { exam_title: examTitle, reason }
    })
  },
}

// ─── ADMIN NOTIFICATIONS ──────────────────────────────
export const adminNotify = {
  async newAdmission(studentName: string, className: string, email: string) {
    await notifyAllAdmins(
      '🎓 New Admission Application',
      `${studentName} applied for ${className}`,
      'info',
      '/admin/inquiries?tab=admissions',
      { applicant: studentName, class: className, email }
    )
  },

  async newInquiry(name: string, subject: string, email: string) {
    await notifyAllAdmins(
      '💬 New Inquiry',
      `${name} sent: "${subject}"`,
      'info',
      '/admin/inquiries?tab=contacts',
      { from: name, subject, email }
    )
  },

  async examSubmitted(teacherName: string, examTitle: string, className: string, subject: string) {
    await notifyAllAdmins(
      '📋 New Exam Submitted',
      `${teacherName} submitted "${examTitle}" (${subject}) for ${className}`,
      'warning',
      '/admin/exams',
      { teacher: teacherName, exam: examTitle, subject, class: className }
    )
  },

  async examApproved(examTitle: string, subject: string, className: string) {
    await notifyAllAdmins(
      '✅ Exam Approved',
      `"${examTitle}" (${subject}) for ${className} has been published`,
      'success',
      '/admin/exams',
      { exam: examTitle, subject, class: className }
    )
  },

  async examRejected(examTitle: string, subject: string, reason: string) {
    await notifyAllAdmins(
      '❌ Exam Rejected',
      `"${examTitle}" (${subject}) was sent back. Reason: ${reason}`,
      'error',
      '/admin/exams',
      { exam: examTitle, subject, reason }
    )
  },

  async reportCardsGenerated(className: string, count: number, term: string, session: string) {
    await notifyAllAdmins(
      '📊 Report Cards Generated',
      `${count} report cards generated for ${className} (${term} ${session})`,
      'success',
      '/admin/report-cards',
      { class: className, count, term, session }
    )
  },

  async reportCardsForReview(className: string, count: number, term: string) {
    await notifyAllAdmins(
      '📄 Report Cards Ready',
      `${count} report cards from ${className} (${term}) need approval`,
      'warning',
      '/admin/report-cards',
      { class: className, count, term }
    )
  },

  async examViolation(studentName: string, examTitle: string, violationType: string, className: string) {
    await notifyAllAdmins(
      '🚨 Exam Violation Detected',
      `${studentName} (${className}) - ${violationType} during "${examTitle}"`,
      'error',
      '/admin/monitor',
      { student: studentName, exam: examTitle, violation: violationType, class: className }
    )
  },

  async autoSubmitted(studentName: string, examTitle: string, reason: string, className: string) {
    await notifyAllAdmins(
      '⛔ Exam Auto-Submitted',
      `${studentName} (${className}) - "${examTitle}" auto-submitted: ${reason}`,
      'error',
      '/admin/monitor',
      { student: studentName, exam: examTitle, reason, class: className }
    )
  },

  async newStudentRegistered(studentName: string, className: string) {
    await notifyAllAdmins(
      '👤 New Student Registered',
      `${studentName} has been registered in ${className}`,
      'info',
      '/admin/students',
      { student: studentName, class: className }
    )
  },
}

// ─── STUDENT NOTIFICATIONS ────────────────────────────
export const studentNotify = {
  async reportCardPublished(studentId: string, term: string, session: string) {
    await notifyStudent(
      studentId,
      '📊 Report Card Ready!',
      `Your ${term} ${session} report card is now available`,
      'success',
      '/student/report-card',
      { term, session }
    )
  },

  async newExamAvailable(studentId: string, examTitle: string, subject: string, examId: string) {
    await notifyStudent(
      studentId,
      '📝 New Exam Available',
      `"${examTitle}" (${subject}) is now available`,
      'info',
      `/student/exams/${examId}`,
      { exam_id: examId, subject }
    )
  },

  async examAutoSubmitted(studentId: string, examTitle: string, reason: string, examId: string) {
    await notifyStudent(
      studentId,
      '⚠️ Exam Auto-Submitted',
      `"${examTitle}" was auto-submitted: ${reason}`,
      'warning',
      `/student/exams/${examId}`,
      { exam_id: examId, reason }
    )
  },

  async theoryGraded(studentId: string, examTitle: string, score: number, examId: string) {
    await notifyStudent(
      studentId,
      '✅ Theory Graded',
      `Your theory for "${examTitle}" scored ${score}/40`,
      'success',
      `/student/exams/${examId}`,
      { exam_id: examId, score }
    )
  },

  async examCompleted(studentId: string, examTitle: string, percentage: number, grade: string, examId: string) {
    await notifyStudent(
      studentId,
      percentage >= 50 ? '🎉 Exam Completed' : '📋 Exam Completed',
      `You scored ${percentage}% (${grade}) in "${examTitle}"`,
      percentage >= 50 ? 'success' : 'warning',
      `/student/exams/${examId}/results`,
      { exam_id: examId, percentage, grade }
    )
  },

  async admissionApproved(studentId: string, className: string) {
    await notifyStudent(
      studentId,
      '🎓 Admission Approved!',
      `Congratulations! Your admission to ${className} has been approved.`,
      'success',
      '/student',
      { class: className }
    )
  },
}

// ─── Get unread count ──────────────────────────────────
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

// ─── Mark notification as read ─────────────────────────
export async function markAsRead(notificationId: string) {
  try {
    await supabase
      .from('notifications')
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq('id', notificationId)
  } catch (error) {
    console.error('Failed to mark as read:', error)
  }
}

// ─── Mark all as read ──────────────────────────────────
export async function markAllAsRead(userId: string) {
  try {
    await supabase
      .from('notifications')
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('read', false)
  } catch (error) {
    console.error('Failed to mark all as read:', error)
  }
}

// ─── Delete notification ───────────────────────────────
export async function deleteNotification(notificationId: string) {
  try {
    await supabase.from('notifications').delete().eq('id', notificationId)
  } catch (error) {
    console.error('Failed to delete notification:', error)
  }
}