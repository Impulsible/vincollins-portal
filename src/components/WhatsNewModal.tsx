// src/components/WhatsNewModal.tsx

'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sparkles, Shield, Zap, Users, GraduationCap, BookOpen } from 'lucide-react'

const features = [
  {
    icon: GraduationCap,
    title: 'New Academic Year',
    description: '2024/2025 session is now open for enrollment'
  },
  {
    icon: BookOpen,
    title: 'Digital Learning',
    description: 'Access to online resources and materials'
  },
  {
    icon: Users,
    title: 'Parent Portal',
    description: 'Track your child\'s progress in real-time'
  },
  {
    icon: Shield,
    title: 'Enhanced Security',
    description: 'Improved data protection and privacy'
  }
]

export function WhatsNewModal() {
  const [open, setOpen] = useState(false)
  const [hasSeen, setHasSeen] = useState(true)

  useEffect(() => {
    const version = process.env.NEXT_PUBLIC_APP_VERSION || '2.0.0'
    const seenVersion = localStorage.getItem('whats_new_version')
    
    if (version !== seenVersion) {
      setOpen(true)
      setHasSeen(false)
    }
  }, [])

  const handleClose = () => {
    const version = process.env.NEXT_PUBLIC_APP_VERSION || '2.0.0'
    localStorage.setItem('whats_new_version', version)
    setOpen(false)
    setHasSeen(true)
  }

  if (hasSeen) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <DialogTitle className="text-xl">What's New at Vincollins</DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-sm text-slate-500">
            We've made some exciting updates for the new academic year!
          </p>
          
          <div className="grid grid-cols-2 gap-3">
            {features.map((feature) => (
              <div key={feature.title} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <feature.icon className="h-4 w-4 text-blue-600 mb-2" />
                <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {feature.title}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
        
        <Button onClick={handleClose} className="w-full bg-[#0A2472] hover:bg-[#1A3A8A]">
          Get Started
        </Button>
      </DialogContent>
    </Dialog>
  )
}