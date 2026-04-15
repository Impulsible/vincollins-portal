'use client'

import { Container } from '@/components/layout/container'
import { Award, Users, GraduationCap, CheckCircle2, Star, Heart, LucideIcon } from 'lucide-react'

// Define strict types
type AccentType = 'gold' | 'red'

interface StatItem {
  value: string
  label: string
  icon: LucideIcon
  description: string
  accent: AccentType
  delay: number
}

const stats: StatItem[] = [
  {
    value: '4+',
    label: 'Years of Excellence',
    icon: Award,
    description: 'Since 2022',
    accent: 'gold',
    delay: 0,
  },
  {
    value: '300+',
    label: 'Active Students',
    icon: Users,
    description: 'Growing Community',
    accent: 'red',
    delay: 1,
  },
  {
    value: '20+',
    label: 'Expert Faculty',
    icon: GraduationCap,
    description: 'Dedicated Educators',
    accent: 'gold',
    delay: 2,
  },
  {
    value: '98%',
    label: 'Success Rate',
    icon: CheckCircle2,
    description: 'Academic Excellence',
    accent: 'red',
    delay: 3,
  },
]

const accentStyles: Record<AccentType, {
  iconWrap: string
  icon: string
  line: string
  ring: string
  glow: string
  badge: string
}> = {
  gold: {
    iconWrap: 'bg-amber-400/15 border-amber-300/20',
    icon: 'text-amber-300',
    line: 'from-transparent via-amber-300 to-transparent',
    ring: 'group-hover:ring-amber-300/30',
    glow: 'group-hover:shadow-[0_18px_45px_rgba(251,191,36,0.12)]',
    badge: 'text-amber-200',
  },
  red: {
    iconWrap: 'bg-rose-400/15 border-rose-300/20',
    icon: 'text-rose-300',
    line: 'from-transparent via-rose-300 to-transparent',
    ring: 'group-hover:ring-rose-300/30',
    glow: 'group-hover:shadow-[0_18px_45px_rgba(244,63,94,0.12)]',
    badge: 'text-rose-200',
  },
}

export function StatsBar() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#081B5C] via-[#0A2472] to-[#153E90] py-16 text-white sm:py-20 lg:py-24">
      {/* Background texture */}
      <div className="absolute inset-0 bg-[url('/images/grid.svg')] opacity-[0.035]" />

      {/* Premium soft glows */}
      <div className="absolute -top-24 right-0 h-80 w-80 rounded-full bg-amber-300/10 blur-3xl" />
      <div className="absolute -bottom-24 left-0 h-80 w-80 rounded-full bg-rose-300/10 blur-3xl" />
      <div className="absolute inset-x-1/3 top-1/3 h-72 w-72 rounded-full bg-white/5 blur-3xl" />

      {/* Elegant border accents */}
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
      <div className="absolute left-0 right-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <Container className="relative px-4 sm:px-6">
        {/* Header */}
        <div className="mb-10 text-center sm:mb-12 lg:mb-16">
          <div className="mb-4 inline-flex items-center gap-3">
            <div className="h-px w-10 bg-gradient-to-r from-transparent to-amber-300/80" />
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-200/95">
              Our Achievements
            </span>
            <div className="h-px w-10 bg-gradient-to-l from-transparent to-amber-300/80" />
          </div>

          <h3 className="font-serif text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
            Excellence You Can Measure
          </h3>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-white/80 sm:text-base">
            A legacy of academic strength, trusted leadership, and student success that
            continues to shape the future.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            const style = accentStyles[stat.accent] // Now TypeScript knows stat.accent is 'gold' | 'red'

            return (
              <div
                key={index}
                className="group animate-fade-in-up"
                style={{ animationDelay: `${stat.delay * 0.12}s` }}
              >
                <article
                  className={cn(
                    'relative h-full overflow-hidden rounded-2xl border border-white/12 bg-white/[0.08] p-6 text-center backdrop-blur-md transition-all duration-300',
                    'shadow-[0_10px_30px_rgba(0,0,0,0.18)]',
                    'hover:-translate-y-1.5 hover:border-white/20 hover:bg-white/[0.11]',
                    'ring-1 ring-transparent',
                    style.ring,
                    style.glow
                  )}
                >
                  {/* top shine */}
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-70" />

                  {/* icon */}
                  <div
                    className={cn(
                      'mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border shadow-md transition-all duration-300',
                      'group-hover:scale-105 group-hover:rotate-[2deg]',
                      style.iconWrap
                    )}
                  >
                    <Icon className={cn('h-7 w-7 transition-transform duration-300 group-hover:scale-110', style.icon)} />
                  </div>

                  {/* value */}
                  <p className="mb-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                    {stat.value}
                  </p>

                  {/* label */}
                  <p className="mb-1 text-sm font-semibold uppercase tracking-[0.14em] text-white">
                    {stat.label}
                  </p>

                  {/* description */}
                  <p className={cn('text-xs leading-5 sm:text-sm', style.badge)}>
                    {stat.description}
                  </p>

                  {/* accent divider */}
                  <div
                    className={cn(
                      'mx-auto mt-5 h-0.5 w-10 rounded-full bg-gradient-to-r transition-all duration-300 group-hover:w-16',
                      style.line
                    )}
                  />

                  {/* subtle hover overlay */}
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent" />
                  </div>
                </article>
              </div>
            )
          })}
        </div>

        {/* Trust pill */}
        <div className="mt-12 border-t border-white/10 pt-8 text-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-3 rounded-full border border-white/12 bg-white/[0.08] px-5 py-3 backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.16)]">
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            </div>

            <div className="hidden h-4 w-px bg-white/20 sm:block" />

            <p className="text-sm text-white/85">
              <span className="font-bold text-amber-200">98%</span> of parents recommend Vincollins
            </p>

            <div className="hidden h-4 w-px bg-white/20 sm:block" />

            <Heart className="h-4 w-4 text-rose-300" />
          </div>
        </div>
      </Container>
    </section>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}