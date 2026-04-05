/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { Container } from '@/components/layout/container'
import { Award, Users, GraduationCap, CheckCircle2, TrendingUp, Star, Heart, Shield } from 'lucide-react'

const stats = [
  { 
    value: '25+', 
    label: 'Years of Excellence', 
    icon: Award,
    description: 'Since 1995',
    color: 'text-secondary',
    bgGradient: 'from-secondary/20 to-secondary/10',
    delay: 0
  },
  { 
    value: '500+', 
    label: 'Active Students', 
    icon: Users,
    description: 'Growing Community',
    color: 'text-accent',
    bgGradient: 'from-accent/20 to-accent/10',
    delay: 1
  },
  { 
    value: '50+', 
    label: 'Expert Faculty', 
    icon: GraduationCap,
    description: 'Dedicated Educators',
    color: 'text-secondary',
    bgGradient: 'from-secondary/20 to-secondary/10',
    delay: 2
  },
  { 
    value: '98%', 
    label: 'Success Rate', 
    icon: CheckCircle2,
    description: 'Academic Excellence',
    color: 'text-accent',
    bgGradient: 'from-accent/20 to-accent/10',
    delay: 3
  },
]

export function StatsBar() {
  return (
    <section className="relative bg-gradient-to-br from-[#0A2472] via-[#0A2472] to-[#1e3a8a] text-white py-16 sm:py-20 lg:py-24 overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 bg-[url('/images/grid.svg')] opacity-5 bg-repeat" />
      
      {/* Animated Gradient Orbs */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-secondary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/20 rounded-full blur-3xl animate-pulse animation-delay-2000" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl" />
      
      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-float-particle"
            style={{
              left: `${(i * 7) % 100}%`,
              top: `${(i * 13) % 100}%`,
              animationDelay: `${i * 0.2}s`,
              animationDuration: `${5 + (i % 5)}s`,
            }}
          />
        ))}
      </div>
      
      {/* Top Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-secondary to-transparent" />
      
      {/* Side Accent Lines */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-secondary to-transparent" />
      <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-secondary to-transparent" />
      
      <Container className="relative px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-secondary" />
            <span className="text-xs font-medium text-secondary uppercase tracking-wider">Our Achievements</span>
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-secondary" />
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            By the Numbers
          </h3>
          <p className="text-white/60 text-sm mt-2 max-w-2xl mx-auto">
            Celebrating milestones and achievements that define our commitment to excellence
          </p>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 lg:gap-12">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div 
                key={index} 
                className="group relative animate-fade-in-up"
                style={{ animationDelay: `${stat.delay * 0.1}s` }}
              >
                {/* Card Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Glow Effect on Hover */}
                <div className={cn(
                  "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl",
                  stat.color.replace('text', 'bg')
                )} />
                
                <div className="relative text-center p-4 sm:p-6">
                  {/* Icon Container */}
                  <div className={cn(
                    "bg-gradient-to-br w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-5 backdrop-blur-sm transition-all duration-500 group-hover:scale-110 group-hover:rotate-3",
                    stat.bgGradient,
                    "shadow-lg group-hover:shadow-xl"
                  )}>
                    <Icon className={cn(
                      "h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 transition-all duration-500",
                      stat.color,
                      "group-hover:scale-110 group-hover:animate-pulse"
                    )} />
                  </div>
                  
                  {/* Value */}
                  <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-1 sm:mb-2 transition-all duration-300 group-hover:scale-110 group-hover:text-secondary">
                    {stat.value}
                  </p>
                  
                  {/* Label */}
                  <p className="text-xs sm:text-sm font-semibold text-white/90 uppercase tracking-wide mb-1">
                    {stat.label}
                  </p>
                  
                  {/* Description */}
                  <p className="text-[10px] sm:text-xs text-white/60">
                    {stat.description}
                  </p>
                  
                  {/* Decorative Element */}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-transparent via-secondary to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Trust Indicator */}
        <div className="mt-12 pt-8 text-center border-t border-white/10">
          <div className="inline-flex items-center gap-4 bg-white/5 backdrop-blur-sm rounded-full px-6 py-3">
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
              <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
              <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
              <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
              <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
            </div>
            <div className="h-4 w-px bg-white/20" />
            <p className="text-xs text-white/80">
              <span className="font-bold text-secondary">98%</span> of parents recommend Vincollins
            </p>
            <div className="h-4 w-px bg-white/20" />
            <Heart className="h-3 w-3 text-secondary animate-pulse" />
          </div>
        </div>
      </Container>
      
      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
    </section>
  )
}

// Helper function for conditional classes
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}