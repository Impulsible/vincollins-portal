// components/layout/header/CBTDialog.tsx
'use client'

import { memo } from 'react'
import { useRouter } from 'next/navigation'
import { Laptop, Shield, Timer, Shuffle, TrendingUp, FileText, RotateCcw, Sparkles, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const cbtFeatures = [
  { title: 'Secure Exam Environment', description: 'Full-screen lockdown mode prevents tab switching, copy-paste, and screenshots', icon: Shield },
  { title: 'Smart Timer System', description: 'Real-time countdown with visual warnings. Auto-submit when time expires', icon: Timer },
  { title: 'Question Randomization', description: 'Questions and options shuffled uniquely for each student', icon: Shuffle },
  { title: 'Instant Results & Analytics', description: 'Objective questions graded immediately with detailed analytics', icon: TrendingUp },
  { title: 'Multi-Format Support', description: 'Support for MCQs, True/False, Theory/Essay questions, and file uploads', icon: FileText },
  { title: 'Auto-Save & Resume', description: 'Progress auto-saved. Resume interrupted exams from where you stopped', icon: RotateCcw },
]

interface CBTDialogProps {
  open: boolean
  onClose: () => void
}

export default function CBTDialog({ open, onClose }: CBTDialogProps) {
  const router = useRouter()

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[85vh] overflow-y-auto p-0">
        <div className="bg-gradient-to-br from-[#0A2472] to-[#1e3a8a] p-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-3xl font-bold flex items-center gap-2">
              <Laptop className="h-6 w-6" />Vincollins CBT Platform
              <Badge className="bg-[#F5A623] text-[#0A2472]">SECURE</Badge>
            </DialogTitle>
            <DialogDescription className="text-white/80 text-sm mt-1">
              Secure, Reliable & Intelligent Online Examination System
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[{ label: '10k+', desc: 'Exams Delivered' }, { label: '99.9%', desc: 'Platform Uptime' }, { label: '256-bit', desc: 'SSL Encryption' }, { label: '24/7', desc: 'Tech Support' }].map((s, i) => (
              <div key={i} className="text-center p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <p className="text-xl font-bold text-[#0A2472]">{s.label}</p>
                <p className="text-[10px] text-gray-600">{s.desc}</p>
              </div>
            ))}
          </div>
          <h3 className="text-lg font-bold text-[#0A2472] mb-4 flex items-center gap-2"><Sparkles className="h-5 w-5 text-[#F5A623]" />Key Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {cbtFeatures.map((f, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:shadow-md transition-all">
                <div className="h-8 w-8 rounded-lg bg-[#F5A623]/10 flex items-center justify-center shrink-0">
                  <f.icon className="h-4 w-4 text-[#F5A623]" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{f.title}</p>
                  <p className="text-xs text-gray-600">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={onClose} size="sm">Close</Button>
            <Button onClick={() => { onClose(); router.push('/portal') }} size="sm" className="bg-[#F5A623] text-[#0A2472] font-bold">
              <KeyRound className="mr-2 h-4 w-4" />Login to Portal
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}