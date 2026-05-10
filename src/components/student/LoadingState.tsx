import { motion } from 'framer-motion'
import { GraduationCap } from 'lucide-react'
import { Header } from '@/components/layout/header'

interface LoadingStateProps {
  profile: any
  onLogout: () => void
}

export function LoadingState({ profile, onLogout }: LoadingStateProps) {
 const formatProfileForHeader = (profile: any) => {
    if (!profile) return undefined
    return {
      id: profile.id,
      name: profile.display_name || profile.full_name,
      firstName: profile.first_name || profile.display_name?.split(' ')[0] || profile.full_name?.split(' ')[0] || 'Student',  // ✅ ADD THIS
      email: profile.email,
      role: 'student' as const,
      avatar: profile.photo_url || undefined,
      isAuthenticated: true
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 overflow-x-hidden">
      <Header user={formatProfileForHeader(profile)} onLogout={onLogout} />
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <GraduationCap className="h-16 w-16 text-emerald-600 mx-auto" />
          </motion.div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4 text-slate-600 text-lg font-medium"
          >
            Loading Student Dashboard...
          </motion.p>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-2 text-slate-500 text-sm"
          >
            Preparing your learning space ✨
          </motion.p>
          <div className="flex justify-center gap-1 mt-4">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="h-2 w-2 rounded-full bg-emerald-400"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}