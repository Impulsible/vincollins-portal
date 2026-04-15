'use client'

import { Card } from '@/components/ui/card'
import { Container } from '@/components/layout/container'
import {
  Eye,
  Lightbulb,
  CheckCircle,
  Globe,
  BookOpen,
  GraduationCap,
  TrendingUp,
  Trophy,
} from 'lucide-react'

export function VisionMission() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white to-gray-50 py-20 lg:py-28">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />

      <Container className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <div className="mx-auto mb-14 max-w-3xl text-center lg:mb-16">
          <div className="mb-4 inline-flex items-center gap-2">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-primary" />
            <span className="text-sm font-semibold uppercase tracking-[0.18em] text-primary/80">
              Our Foundation
            </span>
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-primary" />
          </div>

          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            <span className="text-[#0A2472]">Vision & </span>
            <span className="text-secondary">Mission</span>
          </h2>

          <p className="mx-auto max-w-2xl text-base leading-7 text-gray-600 sm:text-lg">
            Guiding principles that shape our educational philosophy and drive our
            commitment to excellence.
          </p>
        </div>

        {/* Grid */}
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Vision */}
          <Card className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="mb-6 flex items-center gap-4">
              <div className="rounded-xl bg-primary/10 p-3">
                <Eye className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h3 className="font-serif text-2xl font-bold text-[#0A2472]">
                  Our Vision
                </h3>
                <div className="mt-2 h-0.5 w-12 bg-primary" />
              </div>
            </div>

            <p className="mb-6 text-base leading-7 text-gray-700 sm:text-lg">
              To nurture <span className="font-semibold text-primary">happy, successful children</span> 
              by providing a positive, safe and stimulating environment where every child is valued 
              and empowered to become an independent, life-long learner.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-2xl font-bold text-primary">4+</p>
                <p className="text-xs text-gray-600 mt-1">Years of Excellence</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-2xl font-bold text-primary">100%</p>
                <p className="text-xs text-gray-600 mt-1">Pass Rate</p>
              </div>
            </div>

            {/* Principles */}
            <div className="mt-6 border-t border-gray-100 pt-5">
              <div className="flex flex-wrap gap-3">
                {['Holistic Development', 'Safe Environment', 'Life-long Learning'].map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs text-gray-600">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Mission */}
          <Card className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="mb-6 flex items-center gap-4">
              <div className="rounded-xl bg-secondary/10 p-3">
                <Lightbulb className="h-7 w-7 text-secondary" />
              </div>
              <div>
                <h3 className="font-serif text-2xl font-bold text-[#0A2472]">
                  Our Mission
                </h3>
                <div className="mt-2 h-0.5 w-12 bg-secondary" />
              </div>
            </div>

            <p className="mb-3 font-['Dancing_Script',cursive] text-3xl text-secondary">
              Dream, Believe, Achieve.
            </p>

            <p className="mb-6 text-base leading-7 text-gray-700 sm:text-lg">
              To provide students with <span className="font-semibold text-secondary">
              high-quality learning experiences</span> through a broad, balanced curriculum 
              that prepares them for adult responsibility in the modern world.
            </p>

            {/* Features */}
            <div className="flex flex-wrap gap-4">
              {[
                { icon: Globe, text: 'Global Perspective' },
                { icon: BookOpen, text: 'Balanced Curriculum' },
                { icon: GraduationCap, text: 'Future Ready' },
              ].map((item, i) => {
                const Icon = item.icon
                return (
                  <div key={i} className="flex items-center gap-2">
                    <div className="rounded-lg bg-secondary/10 p-1.5">
                      <Icon className="h-4 w-4 text-secondary" />
                    </div>
                    <span className="text-sm text-gray-700">{item.text}</span>
                  </div>
                )
              })}
            </div>

            {/* Stats */}
            <div className="mt-6 flex items-center gap-4 border-t border-gray-100 pt-5">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-secondary" />
                <span className="text-xs text-gray-600">98% Success Rate</span>
              </div>

              <div className="hidden h-4 w-px bg-gray-200 sm:block" />

              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-secondary" />
                <span className="text-xs text-gray-600">Excellence Award</span>
              </div>
            </div>
          </Card>
        </div>
      </Container>
    </section>
  )
}