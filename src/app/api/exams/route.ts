import { supabase } from './supabase'

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getCurrentUserRole() {
  const user = await getCurrentUser()
  if (!user) return null

  // Check if user is a teacher
  const { data: teacher } = await supabase
    .from('teachers')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (teacher) return 'teacher'

  // Check if user is a student
  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (student) return 'student'

  // Check if user is an admin
  const { data: admin } = await supabase
    .from('admins')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (admin) return 'admin'

  return null
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  return user
}

export async function requireTeacher() {
  const user = await requireAuth()
  const role = await getCurrentUserRole()
  if (role !== 'teacher') throw new Error('Teacher access required')
  return user
}

export async function requireStudent() {
  const user = await requireAuth()
  const role = await getCurrentUserRole()
  if (role !== 'student') throw new Error('Student access required')
  return user
}

export async function requireAdmin() {
  const user = await requireAuth()
  const role = await getCurrentUserRole()
  if (role !== 'admin') throw new Error('Admin access required')
  return user
}