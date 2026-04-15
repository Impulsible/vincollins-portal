'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Container } from '@/components/layout/container'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import {
  GraduationCap,
  BookOpen,
  Heart,
  Sparkles,
  ChevronRight,
  Users,
  TrendingUp,
  Star,
  Target,
  Globe,
  Shield,
  Calendar,
} from 'lucide-react'

const sections = [
  {
    title: 'Crèche/Playgroup',
    ageRange: '0–3 years',
    count: '22',
    description:
      'A nurturing environment where our youngest learners develop through play-based activities, sensory experiences, and personalised attention in a safe, caring setting.',
    icon: Heart,
    lightColor: 'text-rose-600',
    bgLight: 'bg-rose-50',
    image: '/images/hero-creche.jpeg',
    features: ['Safe Environment', 'Early Learning', 'Play-based', 'Sensory Play'],
    slug: 'creche-playgroup',
    stats: '22 Students',
  },
  {
    title: 'Nursery',
    ageRange: '3–5 years',
    count: '54',
    description:
      'Building foundational skills through structured activities, creative play, and social interaction, preparing children for a seamless transition to primary education.',
    icon: Sparkles,
    lightColor: 'text-amber-600',
    bgLight: 'bg-amber-50',
    image: '/images/hero-nursery.jpg',
    features: ['Activities', 'Rhymes', 'Real-life Experiences', 'Social Skills'],
    slug: 'nursery',
    stats: '54 Students',
  },
  {
    title: 'Primary',
    ageRange: '5–11 years',
    count: '65',
    description:
      'Developing critical thinking and core academic skills through a comprehensive curriculum that balances traditional subjects with modern learning approaches.',
    icon: BookOpen,
    lightColor: 'text-emerald-600',
    bgLight: 'bg-emerald-50',
    image: '/images/hero-primary.jpg',
    features: ['Core Skills', 'Critical Thinking', 'Character Building', 'STEM'],
    slug: 'primary',
    stats: '65 Students',
  },
  {
    title: 'College',
    ageRange: '11–16 years',
    count: '51',
    description:
      'Preparing students for future success with a challenging curriculum that develops leadership, independence, and academic excellence for higher education.',
    icon: GraduationCap,
    lightColor: 'text-blue-600',
    bgLight: 'bg-blue-50',
    image: '/images/hero-college.jpeg',
    features: ['Balanced Curriculum', 'Future Ready', 'Leadership', 'Excellence'],
    slug: 'college',
    stats: '51 Students',
  },
]

const fallbackImage = '/images/placeholder-school.jpg'

export function SchoolSections() {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})

  const handleImageError = (title: string) => {
    setImageErrors((prev) => ({ ...prev, [title]: true }))
  }

  const getImageSrc = (section: (typeof sections)[0]) => {
    return imageErrors[section.title] ? fallbackImage : section.image
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white py-16 lg:py-24">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />

      <Container className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto mb-12 max-w-3xl text-center lg:mb-16">
          <Badge className="mb-4 border border-primary/10 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary hover:bg-primary/10">
            Academic Programs
          </Badge>

          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            <span className="text-gray-900">Nurturing Excellence</span>
            <span className="mt-1 block text-primary">At Every Stage</span>
          </h2>

          <p className="mx-auto max-w-2xl text-base leading-7 text-gray-600 sm:text-lg">
            From early years to college preparation, discover our comprehensive
            programs designed for holistic development.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {sections.map((section) => {
            const Icon = section.icon

            return (
              <Card
                key={section.title}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gray-300 hover:shadow-xl"
              >
                {/* Image */}
                <div className="relative h-52 w-full overflow-hidden bg-gray-100">
                  <Image
                    src={getImageSrc(section)}
                    alt={section.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1280px) 25vw, 25vw"
                    priority={section.title === 'Crèche/Playgroup' || section.title === 'Nursery'}
                    onError={() => handleImageError(section.title)}
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                  {/* Age badge */}
                  <div className="absolute bottom-3 left-3 z-10">
                    <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/55 px-2.5 py-1.5 backdrop-blur-sm">
                      <Calendar className="h-3 w-3 text-white" />
                      <span className="text-xs font-medium text-white">{section.ageRange}</span>
                    </div>
                  </div>

                  {/* Student badge */}
                  <div className="absolute right-3 top-3 z-10">
                    <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/40 bg-white/92 px-2.5 py-1.5 shadow-sm backdrop-blur-sm">
                      <Users className="h-3.5 w-3.5 text-primary" />
                      <span className="text-[11px] font-semibold text-gray-800">
                        {section.stats}
                      </span>
                    </div>
                  </div>
                </div>

                <CardContent className="flex flex-1 flex-col p-5">
                  {/* Title row */}
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="mb-1 text-lg font-bold text-gray-900 transition-colors duration-300 group-hover:text-primary">
                        {section.title}
                      </h3>

                      <div className="flex items-center gap-2">
                        <div className="h-px w-8 bg-gray-300" />
                        <span className="text-xs font-medium text-gray-500">
                          {section.count} enrolled
                        </span>
                      </div>
                    </div>

                    <div
                      className={`ml-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${section.bgLight} transition-transform duration-300 group-hover:scale-105`}
                    >
                      <Icon className={`h-4.5 w-4.5 ${section.lightColor}`} />
                    </div>
                  </div>

                  {/* Description */}
                  <p className="mb-4 line-clamp-3 text-sm leading-6 text-gray-600">
                    {section.description}
                  </p>

                  {/* Feature tags */}
                  <div className="mb-4 flex flex-wrap gap-2">
                    {section.features.slice(0, 3).map((feature, i) => (
                      <span
                        key={i}
                        className="rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-700"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  {/* Link */}
                  <div className="mt-auto pt-2">
                    <Link
                      href={`/academics/${section.slug}`}
                      className="inline-flex w-full items-center justify-between border-t border-gray-100 pt-3 text-sm font-semibold text-primary transition-colors duration-300 hover:text-primary/80"
                    >
                      <span>Learn more</span>
                      <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <Link href="/schools">
            <Button className="group rounded-xl bg-gradient-to-r from-[#0A2472] to-[#153E90] px-8 py-6 text-base font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:from-[#0A2472] hover:to-[#0A2472] hover:shadow-xl">
              <TrendingUp className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:rotate-6" />
              Explore All Academic Programs
              <ChevronRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
          </Link>

          {/* Trust indicators */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 border-t border-gray-100 pt-6 sm:gap-6">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
              <span className="text-xs font-medium text-gray-700">Top Rated</span>
            </div>

            <div className="hidden h-4 w-px bg-gray-200 sm:block" />

            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-gray-700">Accredited</span>
            </div>

            <div className="hidden h-4 w-px bg-gray-200 sm:block" />

            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-rose-500" />
              <span className="text-xs font-medium text-gray-700">Personalised</span>
            </div>

            <div className="hidden h-4 w-px bg-gray-200 sm:block" />

            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-emerald-500" />
              <span className="text-xs font-medium text-gray-700">Global Standards</span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}