import NextAuth, { AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

declare module 'next-auth' {
  interface User {
    role: 'teacher' | 'student' | 'admin'
    class?: string
    category?: string
  }
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      class?: string
      category?: string
    }
  }
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials')
        }

        try {
          // Check teachers table
          const { data: teacher, error: teacherError } = await supabase
            .from('teachers')
            .select('id, email, full_name, password_hash')
            .eq('email', credentials.email.toLowerCase())
            .single()

          if (teacher && !teacherError && teacher.password_hash) {
            const isValid = await bcrypt.compare(credentials.password, teacher.password_hash)
            if (isValid) {
              return {
                id: teacher.id,
                email: teacher.email,
                name: teacher.full_name,
                role: 'teacher',
              }
            }
          }

          // Check students table
          const { data: student, error: studentError } = await supabase
            .from('students')
            .select('id, email, full_name, password_hash, class, category')
            .eq('email', credentials.email.toLowerCase())
            .single()

          if (student && !studentError && student.password_hash) {
            const isValid = await bcrypt.compare(credentials.password, student.password_hash)
            if (isValid) {
              return {
                id: student.id,
                email: student.email,
                name: student.full_name,
                role: 'student',
                class: student.class,
                category: student.category
              }
            }
          }

          // Check admins table
          const { data: admin, error: adminError } = await supabase
            .from('admins')
            .select('id, email, full_name, password_hash')
            .eq('email', credentials.email.toLowerCase())
            .single()

          if (admin && !adminError && admin.password_hash) {
            const isValid = await bcrypt.compare(credentials.password, admin.password_hash)
            if (isValid) {
              return {
                id: admin.id,
                email: admin.email,
                name: admin.full_name,
                role: 'admin',
              }
            }
          }

          // Demo accounts for testing
          if (process.env.NODE_ENV === 'development') {
            if (credentials.email === 'student@vincollins.edu.ng' && credentials.password === 'student123') {
              return {
                id: 'demo-student',
                email: 'student@vincollins.edu.ng',
                name: 'Demo Student',
                role: 'student',
                class: 'SS2',
                category: 'senior-science'
              }
            }
            if (credentials.email === 'teacher@vincollins.edu.ng' && credentials.password === 'teacher123') {
              return {
                id: 'demo-teacher',
                email: 'teacher@vincollins.edu.ng',
                name: 'Demo Teacher',
                role: 'teacher',
              }
            }
            if (credentials.email === 'admin@vincollins.edu.ng' && credentials.password === 'admin123') {
              return {
                id: 'demo-admin',
                email: 'admin@vincollins.edu.ng',
                name: 'Demo Admin',
                role: 'admin',
              }
            }
          }

          throw new Error('Invalid email or password')
        } catch (error) {
          console.error('Auth error:', error)
          throw new Error('Authentication failed')
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.class = user.class
        token.category = user.category
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.class = token.class as string
        session.user.category = token.category as string
      }
      return session
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/portal',  // Points to your portal page
    error: '/portal',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }