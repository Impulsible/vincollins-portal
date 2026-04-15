/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Container } from '@/components/layout/container'
import { Users, Shield, Award, Target, Star, Heart, Sparkles } from 'lucide-react'

const coreValues = [
  {
    name: 'Respect',
    icon: Users,
    description:
      'Treating others with dignity and consideration, fostering a culture of mutual appreciation.',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
  },
  {
    name: 'Responsibility',
    icon: Shield,
    description:
      'Taking ownership of actions and learning, building accountability and integrity.',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  {
    name: 'Resilience',
    icon: Award,
    description:
      'Bouncing back from challenges stronger, developing grit and perseverance.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  {
    name: 'Aspiration',
    icon: Target,
    description:
      'Dreaming big and working towards goals, reaching for excellence.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  {
    name: 'Independence',
    icon: Star,
    description:
      'Developing self-reliance and confidence, becoming autonomous learners.',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
  },
  {
    name: 'Kindness',
    icon: Heart,
    description:
      'Showing compassion and care for others, building a supportive community.',
    color: 'text-pink-600',
    bg: 'bg-pink-50',
    border: 'border-pink-200',
  },
]

export function Values() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white py-20 lg:py-28">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />

      <Container className="relative px-4 sm:px-6">
        {/* Header */}
        <div className="mx-auto mb-14 max-w-3xl text-center lg:mb-20">
          <Badge className="mb-4 border border-primary/10 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
            Our Foundation
          </Badge>

          <h2 className="mb-4 font-serif text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            <span className="text-gray-900">Six Core Values</span>
          </h2>

          <div className="mx-auto mb-5 h-1 w-20 rounded-full bg-gradient-to-r from-primary via-secondary to-primary" />

          <p className="mx-auto max-w-2xl text-base leading-7 text-gray-600 sm:text-lg">
            Guiding principles that shape our community and develop character in every
            student, preparing them for leadership and success in life.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 md:gap-8">
          {coreValues.map((value) => {
            const Icon = value.icon

            return (
              <Card
                key={value.name}
                className={`group rounded-2xl border bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${value.border}`}
              >
                {/* Icon */}
                <div
                  className={`mb-5 flex h-14 w-14 items-center justify-center rounded-xl ${value.bg} shadow-sm transition-transform duration-300 group-hover:scale-105`}
                >
                  <Icon className={`h-6 w-6 ${value.color}`} />
                </div>

                {/* Title */}
                <h3 className={`mb-3 font-serif text-xl font-bold ${value.color}`}>
                  {value.name}
                </h3>

                {/* Description */}
                <p className="text-sm leading-6 text-gray-600">
                  {value.description}
                </p>

                {/* Footer */}
                <div className="mt-5 flex items-center gap-2 border-t border-gray-100 pt-3">
                  <div
                    className={`h-1 w-3 rounded-full ${value.color.replace(
                      'text-',
                      'bg-'
                    )}`}
                  />
                  <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Core Principle
                  </span>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Quote */}
        <div className="mt-16 text-center">
          <div className="inline-block rounded-2xl border border-gray-100 bg-white px-6 py-5 shadow-md">
            <p className="max-w-2xl text-sm leading-6 text-gray-600">
              <span className="text-lg text-secondary font-serif">"</span>
              These values are not just words—they are lived, practiced, and
              demonstrated daily across our classrooms and community.
              <span className="text-lg text-secondary font-serif">"</span>
            </p>
            <p className="mt-2 text-xs font-semibold text-primary">
              — Vincollins College Philosophy
            </p>
          </div>
        </div>
      </Container>
    </section>
  )
}