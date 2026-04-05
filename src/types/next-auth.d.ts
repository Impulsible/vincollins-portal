import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: 'student' | 'teacher' | 'admin'
      studentClass?: string
      studentCategory?: string
      vinId?: string
      admissionNumber?: string
      cbtAccessId?: string
    } & DefaultSession['user']
  }

  interface User {
    role: 'student' | 'teacher' | 'admin'
    studentClass?: string
    studentCategory?: string
    vinId?: string
    admissionNumber?: string
    cbtAccessId?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: 'student' | 'teacher' | 'admin'
    studentClass?: string
    studentCategory?: string
    vinId?: string
    admissionNumber?: string
    cbtAccessId?: string
  }
}