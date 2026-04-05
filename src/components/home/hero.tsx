'use client'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/layout/container'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
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
  ChevronRight 
} from 'lucide-react'

// Deterministic animation values
const particlePositions = Array.from({ length: 20 }, (_, i) => ({
  left: `${(i * 7) % 100}%`,
  top: `${(i * 13) % 100}%`,
  delay: `${(i * 0.3) % 5}s`,
  duration: `${3 + (i % 5)}s`,
}))

const statItems = [
  { value: '25+', label: 'Years of Excellence', icon: Award, description: 'Since 1995' },
  { value: '500+', label: 'Active Students', icon: Users, description: 'Growing Community' },
  { value: '50+', label: 'Expert Faculty', icon: BookOpen, description: 'Dedicated Educators' },
  { value: '98%', label: 'Success Rate', icon: Star, description: 'Academic Excellence' },
]

const trustFeatures = [
  { icon: Shield, text: 'Safe Environment' },
  { icon: GraduationCap, text: 'Quality Education' },
  { icon: Heart, text: 'Nurturing Care' },
]

// Carousel images
const carouselImages = [
  {
    src: '/images/hero-student.jpg',
    alt: 'Vincollins School Campus',
  },
  {
    src: '/images/computer.jpg',
    alt: 'Vincollins Classroom',
  },
  {
    src: '/images/library.jpg',
    alt: 'Vincollins Library',
  },
]

export function Hero() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const nextImage = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length)
    setTimeout(() => setIsAnimating(false), 500)
  }, [isAnimating])

  const prevImage = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setCurrentImageIndex((prev) => (prev - 1 + carouselImages.length) % carouselImages.length)
    setTimeout(() => setIsAnimating(false), 500)
  }, [isAnimating])

  // Auto-advance carousel every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      nextImage()
    }, 5000)
    return () => clearInterval(interval)
  }, [nextImage])

  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-white to-amber-50 pt-24 lg:pt-32">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
      <div className="absolute top-20 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-pulse animation-delay-2000" />
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particlePositions.map((pos, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary/20 rounded-full animate-float-particle"
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
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-6 lg:space-y-8 animate-fade-in-up max-w-full">
            {/* Established Badge */}
            <div className="inline-flex items-center gap-2 sm:gap-3 bg-white/90 backdrop-blur-sm text-primary px-4 sm:px-5 py-2 rounded-full border border-primary/20 shadow-sm animate-fade-in-left hover:shadow-md transition-all group">
              <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-success"></span>
              </span>
              <span className="text-xs sm:text-sm font-semibold tracking-wide uppercase group-hover:tracking-wider transition-all">
                Est. 2023 • Excellence in Education
              </span>
            </div>
            
            {/* Main Heading */}
            <div className="space-y-3 sm:space-y-4">
              <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight animate-fade-in-right">
                <span className="bg-gradient-to-r from-[#0A2472] via-primary to-[#0A2472] bg-clip-text text-transparent bg-200% animate-gradient">
                  Vincollins
                </span>
                <span className="block text-secondary mt-2 sm:mt-3 relative group">
                  College
                  <span className="absolute -bottom-2 left-0 w-0 group-hover:w-16 h-1 bg-gradient-to-r from-secondary to-transparent rounded-full transition-all duration-500"></span>
                </span>
              </h1>
              <div className="overflow-hidden">
                <p className="font-['Dancing_Script',cursive] text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-secondary/80 leading-relaxed animate-slide-in-left">
                  Geared Towards Success
                </p>
              </div>
            </div>
            
            {/* Enhanced Description */}
            <div className="space-y-4">
              <p className="text-base sm:text-lg md:text-xl text-gray-700 leading-relaxed max-w-xl animate-fade-in-up animation-delay-500">
                <span className="font-bold text-primary">Empowering young minds</span> through a{' '}
                <span className="font-semibold">positive, safe, and stimulating environment</span> where every child discovers their potential, builds confidence, and develops into an{' '}
                <span className="italic text-secondary">independent life-long learner</span>.
              </p>
              <div className="flex items-center gap-2 animate-fade-in-up animation-delay-500">
                <div className="h-px w-12 bg-gradient-to-r from-primary to-transparent" />
                <p className="text-xs text-primary/70 font-medium tracking-wide uppercase">
                  Where excellence meets compassion
                </p>
              </div>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2 sm:pt-4 animate-fade-in-up animation-delay-700">
              <Link href="/portal" className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  className="group bg-gradient-to-r from-[#0A2472] to-[#1e3a8a] hover:from-[#0A2472] hover:to-[#0A2472] text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-6 text-base font-semibold hover:scale-105 w-full relative overflow-hidden rounded-xl border border-white/20 cursor-pointer"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                  <LogIn className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                  Portal Login
                  <ExternalLink className="ml-2 h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Button>
              </Link>
              
              <Link href="/admissions" className="w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="group border-2 border-primary bg-white hover:bg-primary text-primary hover:text-white transition-all duration-300 px-8 py-6 text-base font-semibold hover:scale-105 w-full relative overflow-hidden rounded-xl shadow-md hover:shadow-xl cursor-pointer"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent translate-x-full group-hover:translate-x-0 transition-transform duration-500"></span>
                  Apply Now
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 sm:pt-8 border-t border-gray-200/50 animate-fade-in-up animation-delay-900">
              {statItems.map((stat, index) => {
                const Icon = stat.icon
                return (
                  <div key={index} className="text-center group cursor-default">
                    <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl mb-2 group-hover:scale-110 transition-all duration-300 group-hover:shadow-md">
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary group-hover:animate-pulse" />
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 group-hover:text-primary transition-colors">
                      {stat.value}
                    </p>
                    <p className="text-xs sm:text-sm font-semibold text-gray-800">{stat.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{stat.description}</p>
                  </div>
                )
              })}
            </div>

            {/* Trust Features */}
            <div className="flex flex-wrap items-center gap-4 pt-4 animate-fade-in-up animation-delay-1000">
              {trustFeatures.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <div key={index} className="flex items-center gap-1.5 group cursor-default">
                    <div className="p-1.5 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-xs text-gray-700 group-hover:text-primary transition-colors font-medium">
                      {feature.text}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right Content - Hero Image Carousel */}
          <div className="relative animate-fade-in-right">
            <div className="relative w-full h-[350px] sm:h-[450px] md:h-[550px] lg:h-[600px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl">
              <Image
                src={carouselImages[currentImageIndex].src}
                alt={carouselImages[currentImageIndex].alt}
                fill
                className="object-cover transition-transform duration-700"
                priority
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 100vw, (max-width: 1024px) 50vw, 50vw"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-sm hover:bg-white rounded-full p-2.5 shadow-lg transition-all duration-300 hover:scale-110 z-10 border border-gray-200 cursor-pointer"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5 text-primary" />
              </button>
              
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-sm hover:bg-white rounded-full p-2.5 shadow-lg transition-all duration-300 hover:scale-110 z-10 border border-gray-200 cursor-pointer"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5 text-primary" />
              </button>
              
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {carouselImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (isAnimating) return
                      setIsAnimating(true)
                      setCurrentImageIndex(idx)
                      setTimeout(() => setIsAnimating(false), 500)
                    }}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      currentImageIndex === idx
                        ? 'w-6 bg-white shadow-md'
                        : 'w-2 bg-white/60 hover:bg-white/90'
                    }`}
                    aria-label={`Go to image ${idx + 1}`}
                  />
                ))}
              </div>

              <Sparkles className="absolute top-10 left-10 sm:top-20 sm:left-20 h-4 w-4 sm:h-6 sm:w-6 text-yellow-400 animate-sparkle" />
              <Sparkles className="absolute bottom-10 right-10 sm:bottom-20 sm:right-20 h-5 w-5 sm:h-8 sm:w-8 text-secondary animate-sparkle animation-delay-500" />
              <Sparkles className="absolute top-1/2 left-1/4 h-3 w-3 sm:h-4 sm:w-4 text-primary/30 animate-sparkle animation-delay-1000" />
            </div>
            
            {/* Trust indicator */}
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-full px-5 py-2.5 shadow-lg border border-gray-200/50 animate-fade-in-up hover:scale-105 transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div 
                      key={i} 
                      className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 border-2 border-white shadow-sm animate-float"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
                <div className="h-4 w-px bg-gray-300" />
                <p className="text-xs font-medium text-gray-700">
                  <span className="text-primary font-bold">500+</span> families trust Vincollins
                </p>
                <div className="h-4 w-px bg-gray-300" />
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>

      <style jsx>{`
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s ease infinite;
        }
        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slide-in-left {
          animation: slide-in-left 0.6s ease-out forwards;
        }
        @keyframes float-particle {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.8;
          }
        }
        .animate-float-particle {
          animation: float-particle 8s ease-in-out infinite;
        }
        @keyframes sparkle {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: scale(1.2) rotate(180deg);
          }
        }
        .animate-sparkle {
          animation: sparkle 3s ease-in-out infinite;
        }
        .animation-delay-500 {
          animation-delay: 500ms;
        }
        .animation-delay-1000 {
          animation-delay: 1000ms;
        }
        .animation-delay-2000 {
          animation-delay: 2000ms;
        }
      `}</style>
    </section>
  )
}