'use client'

import { Button } from '@/components/ui/button'
import { Container } from '@/components/layout/container'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  ArrowRight,
  Sparkles,
  Award,
  BookOpen,
  Users,
  LogIn,
  ExternalLink,
  Shield,
  Star,
  GraduationCap,
  Heart,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Target,
  Globe,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────
interface CarouselImage {
  src: string
  alt: string
  objectPosition?: string
}

interface StatItem {
  value: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

interface TrustFeature {
  icon: React.ComponentType<{ className?: string }>
  text: string
}

// ─── Constants ──────────────────────────────────────────
const AUTO_ADVANCE_MS = 5000
const TRANSITION_MS = 700

const carouselImages: CarouselImage[] = [
  {
    src: '/images/students.jpeg',
    alt: 'Vincollins College Student',
    objectPosition: 'object-[center_25%]',
  },
  {
    src: '/images/hero-student.jpg',
    alt: 'Vincollins College Campus',
    objectPosition: 'object-[center_20%]',
  },
  {
    src: '/images/art.jpeg',
    alt: 'Vincollins College Art Gallery',
    objectPosition: 'object-center',
  },
  {
    src: '/images/computer.jpg',
    alt: 'Vincollins College Computer Lab',
    objectPosition: 'object-center',
  },
  {
    src: '/images/library.jpg',
    alt: 'Vincollins College Library',
    objectPosition: 'object-center',
  },
]

const statItems: StatItem[] = [
  { value: '4+', label: 'Years of Excellence', icon: Award, description: 'Since 2022' },
  { value: '300+', label: 'Active Students', icon: Users, description: 'Growing Community' },
  { value: '20+', label: 'Expert Faculty', icon: BookOpen, description: 'Dedicated Educators' },
  { value: '98%', label: 'Success Rate', icon: Star, description: 'Academic Excellence' },
]

const trustFeatures: TrustFeature[] = [
  { icon: Shield, text: 'Safe Environment' },
  { icon: GraduationCap, text: 'Quality Education' },
  { icon: Heart, text: 'Nurturing Care' },
  { icon: Trophy, text: 'Excellence Driven' },
  { icon: Target, text: 'Goal Oriented' },
  { icon: Globe, text: 'Global Standards' },
]

const particlePositions = Array.from({ length: 30 }, (_, i) => ({
  left: `${(i * 7) % 100}%`,
  top: `${(i * 13) % 100}%`,
  delay: `${(i * 0.3) % 5}s`,
  duration: `${3 + (i % 5)}s`,
}))

// ─── Component ──────────────────────────────────────────
export function Hero() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set())
  
  const isAnimatingRef = useRef(false)
  const isHoveredRef = useRef(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const touchStartX = useRef(0)

  // ─── Autoplay Engine ───────────────────────────────────
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      if (!isHoveredRef.current && !document.hidden && !isAnimatingRef.current) {
        setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length)
      }
    }, AUTO_ADVANCE_MS)
  }, [])

  useEffect(() => {
    startTimer()
    const handleVisibilityChange = () => {
      if (document.hidden && timerRef.current) {
        clearInterval(timerRef.current)
      } else {
        startTimer()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [startTimer])

  // ─── Navigation ────────────────────────────────────────
  const goToImage = useCallback((index: number) => {
    if (isAnimatingRef.current) return
    
    isAnimatingRef.current = true
    setCurrentImageIndex(index)
    startTimer()
    
    setTimeout(() => {
      isAnimatingRef.current = false
    }, TRANSITION_MS)
  }, [startTimer])

  const nextImage = useCallback(() => {
    goToImage((currentImageIndex + 1) % carouselImages.length)
  }, [currentImageIndex, goToImage])

  const prevImage = useCallback(() => {
    goToImage((currentImageIndex - 1 + carouselImages.length) % carouselImages.length)
  }, [currentImageIndex, goToImage])

  // ─── Event Handlers ────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevImage()
      if (e.key === 'ArrowRight') nextImage()
    },
    [prevImage, nextImage],
  )

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    isHoveredRef.current = true
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    isHoveredRef.current = false
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextImage()
      else prevImage()
    }
  }

  const handleImageError = (index: number) => {
    setImageErrors((prev) => new Set(prev).add(index))
  }

  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0A2472]/5 via-white to-[#dc2626]/5 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pt-24 lg:pt-32 transition-colors duration-300">
      
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Showing slide {currentImageIndex + 1} of {carouselImages.length}: {carouselImages[currentImageIndex].alt}
      </div>

      <div className="absolute inset-0 hero-grid-pattern opacity-[0.02] dark:opacity-[0.05]" />
      <div className="absolute top-20 left-10 w-96 h-96 bg-[#0A2472]/5 dark:bg-blue-600/10 rounded-full blur-3xl animate-pulse pointer-events-none motion-reduce:animate-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#dc2626]/5 dark:bg-red-600/10 rounded-full blur-3xl animate-pulse hero-delay-2000 pointer-events-none motion-reduce:animate-none" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none motion-reduce:hidden" aria-hidden="true">
        {particlePositions.map((pos, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[#0A2472]/20 dark:bg-blue-400/30 rounded-full animate-hero-float-particle"
            style={{
              left: pos.left,
              top: pos.top,
              animationDelay: pos.delay,
              animationDuration: pos.duration,
            }}
          />
        ))}
      </div>

      <Container className="relative py-4 lg:py-6 px-4 sm:px-6">
        {/* CHANGED: items-center -> items-start to align top edges */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">
          
          {/* ── Left Content ── */}
          <div className="space-y-6 lg:space-y-8 animate-hero-fade-in-up max-w-full">
            <div className="inline-flex items-center gap-2 sm:gap-3 bg-white/90 dark:bg-slate-900/80 backdrop-blur-md text-[#0A2472] dark:text-blue-300 px-4 sm:px-5 py-2 rounded-full border border-[#0A2472]/20 dark:border-blue-500/30 shadow-sm animate-hero-fade-in-left hover:shadow-md transition-all group">
              <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5 motion-reduce:hidden">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-emerald-500" />
              </span>
              <span className="text-xs sm:text-sm font-semibold tracking-wide uppercase group-hover:tracking-wider transition-all dark:text-slate-200">
                Est. 2022 • Excellence in Education
              </span>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight animate-hero-fade-in-right">
                <span className="bg-gradient-to-r from-[#0A2472] via-[#1e3a8a] to-[#0A2472] dark:from-blue-400 dark:via-indigo-300 dark:to-blue-200 bg-clip-text text-transparent animate-hero-gradient">
                  Vincollins
                </span>
                <span className="inline sm:block text-[#dc2626] dark:text-red-500 ml-3 sm:ml-0 sm:mt-2 lg:mt-3 relative group">
                  College
                  <span className="absolute -bottom-2 left-0 w-0 group-hover:w-20 h-1 bg-gradient-to-r from-[#dc2626] dark:from-red-500 to-transparent rounded-full transition-all duration-500 motion-reduce:transition-none" />
                </span>
              </h1>
              <div className="overflow-hidden">
                <p className="font-dancing text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-[#dc2626] dark:text-amber-400 leading-relaxed animate-hero-slide-in-left">
                  Geared Towards Excellence
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-base sm:text-lg md:text-xl text-gray-700 dark:text-slate-300 leading-relaxed max-w-xl animate-hero-fade-in-up hero-delay-500">
                <span className="font-bold text-[#0A2472] dark:text-blue-400">Empowering young minds</span> through a{' '}
                <span className="font-semibold text-slate-900 dark:text-white">positive, safe, and stimulating environment</span> where every child discovers their potential, builds confidence, and develops into an{' '}
                <span className="italic text-[#dc2626] dark:text-amber-400">independent life-long learner</span>.
              </p>
              <div className="flex items-center gap-2 animate-hero-fade-in-up hero-delay-500">
                <div className="h-px w-12 bg-gradient-to-r from-[#0A2472] dark:from-blue-500 to-transparent" />
                <p className="text-xs text-[#0A2472]/70 dark:text-blue-300/80 font-medium tracking-wide uppercase">
                  Where excellence meets compassion
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-2 sm:pt-4 animate-hero-fade-in-up hero-delay-700">
              <Button
                asChild
                size="lg"
                className="group w-full sm:w-auto bg-gradient-to-r from-[#0A2472] to-[#1e3a8a] dark:from-blue-600 dark:to-indigo-600 hover:from-[#0A2472] hover:to-[#0A2472] dark:hover:from-blue-500 dark:hover:to-indigo-500 text-white shadow-lg shadow-blue-900/20 dark:shadow-blue-900/40 hover:shadow-xl transition-all duration-300 px-8 py-6 text-base font-semibold hover:scale-105 relative overflow-hidden rounded-xl border border-white/20 cursor-pointer"
              >
                <Link href="/portal" className="flex items-center justify-center">
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 motion-reduce:transition-none" />
                  <LogIn className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform motion-reduce:transition-none" />
                  Portal Login
                  <ExternalLink className="ml-2 h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform motion-reduce:transition-none" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="group w-full sm:w-auto border-2 border-[#0A2472] dark:border-slate-700 bg-white dark:bg-slate-900/80 backdrop-blur-sm hover:bg-[#0A2472] dark:hover:bg-slate-800 text-[#0A2472] dark:text-slate-200 hover:text-white dark:hover:text-white transition-all duration-300 px-8 py-6 text-base font-semibold hover:scale-105 relative overflow-hidden rounded-xl shadow-md hover:shadow-xl cursor-pointer"
              >
                <Link href="/admission" className="flex items-center justify-center">
                  <span className="absolute inset-0 bg-gradient-to-r from-[#0A2472]/10 dark:from-blue-500/10 via-[#0A2472]/5 to-transparent translate-x-full group-hover:translate-x-0 transition-transform duration-500 motion-reduce:transition-none" />
                  Apply Now
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform motion-reduce:transition-none" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 sm:pt-8 border-t border-gray-200/60 dark:border-slate-800 animate-hero-fade-in-up hero-delay-900">
              {statItems.map((stat, index) => {
                const Icon = stat.icon
                return (
                  <div key={index} className="text-center group cursor-default">
                    <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#0A2472]/10 to-[#0A2472]/5 dark:from-blue-500/20 dark:to-blue-500/10 rounded-xl mb-2 group-hover:scale-110 transition-all duration-300 group-hover:shadow-md">
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-[#0A2472] dark:text-blue-400 group-hover:animate-pulse motion-reduce:animate-none" />
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white group-hover:text-[#0A2472] dark:group-hover:text-blue-300 transition-colors">
                      {stat.value}
                    </p>
                    <p className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-slate-200">{stat.label}</p>
                    <p className="text-[10px] text-muted-foreground dark:text-slate-400 mt-0.5">{stat.description}</p>
                  </div>
                )
              })}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-4 animate-hero-fade-in-up hero-delay-1000">
              {trustFeatures.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <div key={index} className="flex items-center gap-1.5 group cursor-default">
                    <div className="p-1.5 bg-[#0A2472]/10 dark:bg-blue-500/20 rounded-lg group-hover:bg-[#0A2472]/20 dark:group-hover:bg-blue-500/30 transition-colors">
                      <Icon className="h-3.5 w-3.5 text-[#0A2472] dark:text-blue-400" />
                    </div>
                    <span className="text-xs text-gray-700 dark:text-slate-300 group-hover:text-[#0A2472] dark:group-hover:text-blue-300 transition-colors font-medium">
                      {feature.text}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Right Content: Carousel ── */}
          <div className="relative animate-hero-fade-in-right">
            <div
              className="relative w-full h-[350px] sm:h-[450px] md:h-[550px] lg:h-[600px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0A2472]/50 dark:focus-visible:ring-blue-500/50"
              role="region"
              aria-roledescription="carousel"
              aria-label="Campus highlights"
              onKeyDown={handleKeyDown}
              onMouseEnter={() => { isHoveredRef.current = true }}
              onMouseLeave={() => { isHoveredRef.current = false }}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              tabIndex={0}
            >
              {carouselImages.map((image, index) => (
                <div
                  key={image.src}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`Slide ${index + 1} of ${carouselImages.length}: ${image.alt}`}
                  aria-hidden={currentImageIndex !== index}
                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                    currentImageIndex === index ? 'opacity-100 z-[1]' : 'opacity-0 z-0'
                  }`}
                >
                  {!imageErrors.has(index) ? (
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      className={`object-cover ${image.objectPosition || 'object-center'}`}
                      priority={index === 0}
                      loading={index === 0 ? 'eager' : 'lazy'}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
                      onError={() => handleImageError(index)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0A2472]/10 to-[#dc2626]/10 dark:from-blue-900/30 dark:to-red-900/30">
                      <div className="text-center p-6">
                        <GraduationCap className="h-16 w-16 mx-auto text-[#0A2472] dark:text-blue-400 mb-3" />
                        <p className="text-sm font-medium text-gray-700 dark:text-slate-300">{image.alt}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <div
                className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-[2] pointer-events-none"
                aria-hidden="true"
              />

              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/95 dark:bg-slate-900/90 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-800 rounded-full p-2.5 shadow-lg transition-transform duration-300 hover:scale-110 z-10 border border-gray-200 dark:border-slate-800 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A2472]"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-5 w-5 text-[#0A2472] dark:text-blue-400" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/95 dark:bg-slate-900/90 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-800 rounded-full p-2.5 shadow-lg transition-transform duration-300 hover:scale-110 z-10 border border-gray-200 dark:border-slate-800 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A2472]"
                aria-label="Next slide"
              >
                <ChevronRight className="h-5 w-5 text-[#0A2472] dark:text-blue-400" />
              </button>

              <div
                className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10"
                role="tablist"
                aria-label="Slide navigation"
              >
                {carouselImages.map((_, idx) => (
                  <button
                    key={idx}
                    role="tab"
                    aria-selected={currentImageIndex === idx}
                    aria-label={`Go to slide ${idx + 1}`}
                    onClick={() => goToImage(idx)}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                      currentImageIndex === idx
                        ? 'w-6 bg-white shadow-md'
                        : 'w-2 bg-white/60 hover:bg-white/90'
                    }`}
                  />
                ))}
              </div>

              <Sparkles
                className="absolute top-10 left-10 sm:top-20 sm:left-20 h-4 w-4 sm:h-6 sm:w-6 text-amber-400 animate-hero-sparkle z-[3] motion-reduce:hidden"
                aria-hidden="true"
              />
              <Sparkles
                className="absolute bottom-10 right-10 sm:bottom-20 sm:right-20 h-5 w-5 sm:h-8 sm:w-8 text-[#dc2626] dark:text-red-500 animate-hero-sparkle hero-delay-500 z-[3] motion-reduce:hidden"
                aria-hidden="true"
              />
              <Sparkles
                className="absolute top-1/2 left-1/4 h-3 w-3 sm:h-4 sm:w-4 text-[#0A2472]/30 dark:text-blue-400/40 animate-hero-sparkle hero-delay-1000 z-[3] motion-reduce:hidden"
                aria-hidden="true"
              />
            </div>

            {/* ── Minimalist Trust Badge ── */}
            <div className="absolute -bottom-5 sm:-bottom-6 left-1/2 -translate-x-1/2 z-20">
              <div className="flex items-center gap-2.5 sm:gap-3 bg-white dark:bg-slate-900 rounded-full px-4 py-2 sm:px-5 sm:py-2.5 shadow-xl border border-gray-100 dark:border-slate-800">
                
                {/* 3 Blue Circles */}
                <div className="flex -space-x-1.5 sm:-space-x-2" aria-hidden="true">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#0A2472] dark:bg-blue-600 border-[1.5px] border-white dark:border-slate-900 shadow-sm"
                    />
                  ))}
                </div>

                {/* Divider */}
                <div className="h-5 sm:h-6 w-px bg-gray-200 dark:bg-slate-700" aria-hidden="true" />

                {/* Stacked Text */}
                <div className="flex flex-col justify-center">
                  <p className="text-[10px] sm:text-xs font-medium text-gray-700 dark:text-slate-200 leading-[1.2]">
                    <span className="font-bold text-[#0A2472] dark:text-blue-400">500+</span> families
                  </p>
                  <p className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-slate-400 leading-[1.2]">
                    trust Vincollins
                  </p>
                </div>

                {/* Divider */}
                <div className="h-5 sm:h-6 w-px bg-gray-200 dark:bg-slate-700" aria-hidden="true" />

                {/* Stars Only */}
                <div className="flex gap-0.5" aria-label="5 out of 5 stars">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-amber-400 text-amber-400"
                      aria-hidden="true"
                    />
                  ))}
                </div>
                
              </div>
            </div>

          </div>
        </div>
      </Container>
    </section>
  )
}