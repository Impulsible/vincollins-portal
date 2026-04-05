// src/components/admin/dashboard/CBTStatus.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, Timer, ShieldAlert, Brain, Zap } from 'lucide-react'

export function CBTStatus() {
  const features = [
    { name: 'Question Randomization', status: 'Active', icon: Shield, color: 'text-green-600' },
    { name: 'Timer Lock', status: 'Active', icon: Timer, color: 'text-green-600' },
    { name: 'Tab Switch Detection', status: 'Active', icon: ShieldAlert, color: 'text-green-600' },
    { name: 'AI Proctoring', status: 'Coming Soon', icon: Brain, color: 'text-yellow-600' },
    { name: 'Face Recognition', status: 'Coming Soon', icon: Zap, color: 'text-yellow-600' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>CBT System Status</CardTitle>
        <CardDescription>Anti-malpractice features active</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {features.map((feature) => (
          <div key={feature.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <feature.icon className={`h-4 w-4 ${feature.color}`} />
              <span className="text-sm">{feature.name}</span>
            </div>
            <Badge className={
              feature.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }>{feature.status}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}