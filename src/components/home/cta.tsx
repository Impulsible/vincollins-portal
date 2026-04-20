/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Container } from '@/components/layout/container'
import {
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  Calendar,
  Users,
  GraduationCap,
  Award,
  Heart,
  Clock,
  Globe,
  TrendingUp,
  CheckCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function CTA() {
  const containerRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  })

  const opacity = useTransform(scrollYProgress, [0, 1], [0.35, 0.15])
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.04])

  const stats = [
    {
      icon: Users,
      value: '300+',
      label: 'Happy Students',
      description: 'Growing community',
      accent: 'gold',
      delay: 0,
    },
    {
      icon: GraduationCap,
      value: '98%',
      label: 'Success Rate',
      description: 'Academic excellence',
      accent: 'red',
      delay: 1,
    },
    {
      icon: Award,
      value: '4+',
      label: 'Years of Excellence',
      description: 'Since 2022',
      accent: 'gold',
      delay: 2,
    },
  ]

  const benefits = [
    { icon: CheckCircle, text: 'Quality Education' },
    { icon: Heart, text: 'Nurturing Environment' },
    { icon: Globe, text: 'Global Standards' },
    { icon: TrendingUp, text: 'Future Ready' },
  ]

  const accents = {
    gold: {
      iconWrap: 'bg-amber-400/15 border-amber-300/20',
      icon: 'text-amber-300',
      statLine: 'from-transparent via-amber-300 to-transparent',
    },
    red: {
      iconWrap: 'bg-rose-400/15 border-rose-300/20',
      icon: 'text-rose-300',
      statLine: 'from-transparent via-rose-300 to-transparent',
    },
  } as const

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden py-16 sm:py-20 md:py-24 lg:py-28"
    >
      {/* Base background - Darker for better white contrast */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#061540] via-[#081B5C] to-[#0A2472]" />

      {/* Enhanced glow effects for better depth */}
      <motion.div style={{ opacity, scale }} className="absolute inset-0">
        <div className="absolute -top-20 right-0 h-[400px] w-[400px] rounded-full bg-amber-400/15 blur-3xl" />
        <div className="absolute -bottom-20 left-0 h-[400px] w-[400px] rounded-full bg-rose-400/15 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/8 blur-3xl" />
      </motion.div>

      {/* Darker grid overlay for texture */}
      <div className="absolute inset-0 bg-[url('/images/grid.svg')] bg-repeat opacity-[0.03]" />

      {/* Top border accent - Brighter for better visibility */}
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

      <Container className="relative px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mx-auto max-w-6xl"
        >
          {/* Badge - Enhanced contrast */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.45 }}
            viewport={{ once: true }}
            className="flex justify-center"
          >
            <Badge className="mb-5 border border-white/25 bg-white/15 px-4 py-2 text-white shadow-xl backdrop-blur-md transition-colors duration-300 hover:bg-white/20">
              <Sparkles className="mr-2 h-3.5 w-3.5 text-amber-300" />
              <span className="text-xs font-semibold tracking-wide sm:text-sm">
                Join Our Community Today
              </span>
            </Badge>
          </motion.div>

          {/* Heading - Enhanced white contrast */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.55 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="px-4 text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl lg:text-6xl drop-shadow-lg">
              Join the Vincollins Community
            </h2>

            <div className="mx-auto mb-5 mt-5 h-1 w-24 rounded-full bg-gradient-to-r from-amber-400 via-white to-rose-400" />

            <p className="mx-auto max-w-3xl px-4 text-base leading-7 text-white/95 sm:text-lg md:text-xl drop-shadow">
              Experience excellence in education. Apply now to begin your journey with
              Vincollins College and become part of a community that nurtures future
              leaders.
            </p>
          </motion.div>

          {/* CTA buttons - Enhanced contrast */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.55 }}
            viewport={{ once: true }}
            className="mb-12 mt-8 flex flex-col justify-center gap-4 px-4 sm:flex-row sm:mt-10 sm:gap-5"
          >
            <Link href="/admission" className="w-full sm:w-auto">
              <Button
                size="lg"
                className={cn(
                  'w-full rounded-xl border border-amber-400/40 bg-amber-400 text-slate-950 shadow-[0_12px_30px_rgba(0,0,0,0.25)] transition-all duration-300',
                  'px-6 py-6 text-base font-bold hover:-translate-y-0.5 hover:bg-amber-300 hover:shadow-[0_18px_40px_rgba(0,0,0,0.3)] sm:w-auto sm:px-8 sm:text-lg'
                )}
              >
                <GraduationCap className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:rotate-6" />
                Apply Now
                <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </Link>

            <Link href="/contact" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className={cn(
                  'w-full rounded-xl border-2 border-white/40 bg-white/12 px-6 py-6 text-base font-semibold text-white backdrop-blur-md transition-all duration-300',
                  'hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/20 hover:text-white sm:w-auto sm:px-8 sm:text-lg'
                )}
              >
                <Calendar className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:scale-105" />
                Schedule a Visit
              </Button>
            </Link>
          </motion.div>

          {/* Benefits - Enhanced contrast */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.55 }}
            viewport={{ once: true }}
            className="mb-10 flex flex-wrap justify-center gap-3 px-4 sm:mb-12"
          >
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <div
                  key={index}
                  className="flex items-center gap-2 rounded-full border border-white/25 bg-white/12 px-4 py-2 backdrop-blur-md"
                >
                  <Icon className="h-3.5 w-3.5 text-amber-300" />
                  <span className="whitespace-nowrap text-xs font-medium text-white sm:text-sm">
                    {benefit.text}
                  </span>
                </div>
              )
            })}
          </motion.div>

          {/* Stats - Enhanced contrast */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.55 }}
            viewport={{ once: true }}
            className="mb-10 grid grid-cols-1 gap-5 px-4 sm:mb-12 sm:grid-cols-3 sm:gap-6"
          >
            {stats.map((stat, index) => {
              const Icon = stat.icon
              const accent = accents[stat.accent as keyof typeof accents]

              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.96 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.55 + stat.delay * 0.1, duration: 0.45 }}
                  viewport={{ once: true }}
                  className="group text-center"
                >
                  <div className="rounded-2xl border border-white/20 bg-white/[0.10] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.15] hover:border-white/30">
                    <div
                      className={cn(
                        'mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border shadow-md transition-transform duration-300 group-hover:scale-105',
                        accent.iconWrap
                      )}
                    >
                      <Icon className={cn('h-7 w-7', accent.icon)} />
                    </div>

                    <p className="mb-1 text-3xl font-bold tracking-tight text-white drop-shadow">
                      {stat.value}
                    </p>
                    <p className="text-sm font-semibold text-white/95">{stat.label}</p>
                    <p className="mt-1 text-xs text-white/80">{stat.description}</p>

                    <div
                      className={cn(
                        'mx-auto mt-4 h-0.5 w-10 rounded-full bg-gradient-to-r transition-all duration-300 group-hover:w-14',
                        accent.statLine
                      )}
                    />
                  </div>
                </motion.div>
              )
            })}
          </motion.div>

          {/* ✅ FIXED Contact cards - Corrected phone number and added suppressHydrationWarning */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.55 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 gap-4 border-t border-white/25 px-4 pt-8 sm:grid-cols-2 md:grid-cols-3"
          >
            <Link
              href="tel:+2349121155554"
              className="group rounded-2xl border border-white/20 bg-white/[0.08] p-4 text-white/90 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.14] hover:text-white hover:border-white/35"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-white/15 p-2.5 transition-colors duration-300 group-hover:bg-white/25">
                  <Phone className="h-4 w-4 text-amber-300" />
                </div>
                <div>
                  <p className="text-xs text-white/70">Call Us</p>
                  <p className="text-sm font-semibold text-white" suppressHydrationWarning>
                    +234 912 1155 554
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="mailto:vincollinscollege@gmail.com"
              className="group rounded-2xl border border-white/20 bg-white/[0.08] p-4 text-white/90 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.14] hover:text-white hover:border-white/35"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-white/15 p-2.5 transition-colors duration-300 group-hover:bg-white/25">
                  <Mail className="h-4 w-4 text-amber-300" />
                </div>
                <div>
                  <p className="text-xs text-white/70">Email Us</p>
                  <p className="text-sm font-semibold text-white" suppressHydrationWarning>
                    vincollinscollege@gmail.com
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="https://maps.google.com"
              target="_blank"
              className="group rounded-2xl border border-white/20 bg-white/[0.08] p-4 text-white/90 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.14] hover:text-white hover:border-white/35 sm:col-span-2 md:col-span-1"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-white/15 p-2.5 transition-colors duration-300 group-hover:bg-white/25">
                  <MapPin className="h-4 w-4 text-rose-300" />
                </div>
                <div>
                  <p className="text-xs text-white/70">Visit Us</p>
                  <p className="text-sm font-semibold text-white" suppressHydrationWarning>
                    7/9, Lawani Street, off Ishaga Rd, Surulere, Lagos
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Bottom helper text - Enhanced contrast */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.75, duration: 0.55 }}
            viewport={{ once: true }}
            className="mt-8 px-4 text-center sm:mt-10"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/[0.10] px-4 py-2 backdrop-blur-md">
              <Clock className="h-3.5 w-3.5 text-amber-300" />
              <p className="text-xs text-white/85 sm:text-sm">
                Limited seats available for the upcoming academic session
              </p>
            </div>
          </motion.div>
        </motion.div>
      </Container>

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/35 to-transparent" />
    </section>
  )
}