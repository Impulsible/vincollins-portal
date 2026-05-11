// components/layout/header/types.ts
export type UserRole = 'admin' | 'teacher' | 'student'

export interface HeaderUser {
  id: string
  name: string
  firstName: string
  email: string
  role: UserRole
  avatar?: string
  isAuthenticated: boolean
}

export interface SchoolSettings {
  school_name?: string | null
  logo_path?: string | null
  school_phone?: string | null
  school_email?: string | null
}

export interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  link: string | null
  metadata: any
  created_at: string
}

export interface NavigationItem {
  name: string
  href: string
  icon: any
  isCbt?: boolean
  isDropdown?: boolean
  dropdownItems?: { name: string; href: string; icon: any }[]
}

export interface HeaderProps {
  user?: HeaderUser
  onLogout?: () => void
}