/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Container } from '@/components/layout/container'
import { Users, Shield, Award, Target, Star, Heart, Sparkles, Crown, Compass, Leaf, Sun } from 'lucide-react'

const coreValues = [
  { 
    name: 'Respect', 
    icon: Users, 
    description: 'Treating others with dignity and consideration, fostering a culture of mutual appreciation',
    color: 'text-rose-600',
    gradient: 'from-rose-50 to-rose-100',
    borderColor: 'border-rose-200',
    hoverBg: 'hover:border-rose-300',
    iconBg: 'bg-rose-100',
    delay: 0
  },
  { 
    name: 'Responsibility', 
    icon: Shield, 
    description: 'Taking ownership of actions and learning, building accountability and integrity',
    color: 'text-amber-600',
    gradient: 'from-amber-50 to-amber-100',
    borderColor: 'border-amber-200',
    hoverBg: 'hover:border-amber-300',
    iconBg: 'bg-amber-100',
    delay: 1
  },
  { 
    name: 'Resilience', 
    icon: Award, 
    description: 'Bouncing back from challenges stronger, developing grit and perseverance',
    color: 'text-emerald-600',
    gradient: 'from-emerald-50 to-emerald-100',
    borderColor: 'border-emerald-200',
    hoverBg: 'hover:border-emerald-300',
    iconBg: 'bg-emerald-100',
    delay: 2
  },
  { 
    name: 'Aspiration', 
    icon: Target, 
    description: 'Dreaming big and working towards goals, reaching for excellence',
    color: 'text-blue-600',
    gradient: 'from-blue-50 to-blue-100',
    borderColor: 'border-blue-200',
    hoverBg: 'hover:border-blue-300',
    iconBg: 'bg-blue-100',
    delay: 3
  },
  { 
    name: 'Independence', 
    icon: Star, 
    description: 'Developing self-reliance and confidence, becoming autonomous learners',
    color: 'text-purple-600',
    gradient: 'from-purple-50 to-purple-100',
    borderColor: 'border-purple-200',
    hoverBg: 'hover:border-purple-300',
    iconBg: 'bg-purple-100',
    delay: 4
  },
  { 
    name: 'Kindness', 
    icon: Heart, 
    description: 'Showing compassion and care for others, building a supportive community',
    color: 'text-pink-600',
    gradient: 'from-pink-50 to-pink-100',
    borderColor: 'border-pink-200',
    hoverBg: 'hover:border-pink-300',
    iconBg: 'bg-pink-100',
    delay: 5
  },
]

export function Values() {
  return (
    <section className="relative py-20 sm:py-24 lg:py-32 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-amber-50">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-pulse animation-delay-2000" />
      
      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary/20 rounded-full animate-float-particle"
            style={{
              left: `${(i * 13) % 100}%`,
              top: `${(i * 7) % 100}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${5 + (i % 5)}s`,
            }}
          />
        ))}
      </div>
      
      <Container className="relative px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 lg:mb-20">
          <div className="inline-flex items-center gap-2 mb-4 sm:mb-6">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-primary" />
            <Badge className="bg-primary/10 text-primary border-0 px-5 py-2 text-sm font-medium animate-fade-in-down">
              Our Foundation
            </Badge>
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-primary" />
          </div>
          
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 animate-fade-in-up">
            <span className="bg-gradient-to-r from-[#0A2472] via-primary to-[#0A2472] bg-clip-text text-transparent bg-200% animate-gradient">
              Six Core Values
            </span>
          </h2>
          
          <div className="w-20 h-1 bg-gradient-to-r from-primary via-secondary to-primary mx-auto mb-4 sm:mb-6 rounded-full animate-fade-in-up animation-delay-300" />
          
          <p className="text-base sm:text-lg text-gray-600 animate-fade-in-up animation-delay-300 max-w-2xl mx-auto">
            Guiding principles that shape our community and develop character in every student, 
            preparing them for leadership and success in life.
          </p>
        </div>

        {/* Values Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {coreValues.map((value, index) => {
            const Icon = value.icon
            return (
              <Card 
                key={value.name}
                className={cn(
                  "group relative overflow-hidden border-2 bg-white transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl",
                  value.borderColor,
                  value.hoverBg
                )}
                style={{ animationDelay: `${value.delay * 0.1}s` }}
              >
                {/* Gradient Overlay */}
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                  value.gradient
                )} />
                
                {/* Top Accent Line */}
                <div className={cn(
                  "absolute top-0 left-0 right-0 h-1 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left",
                  value.color.replace('text-', 'bg-')
                )} />
                
                <div className="relative p-6 md:p-8">
                  {/* Icon Container */}
                  <div className={cn(
                    "mb-5 w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6",
                    value.iconBg,
                    "shadow-md group-hover:shadow-lg"
                  )}>
                    <Icon className={cn(
                      "h-6 w-6 md:h-7 md:w-7 transition-all duration-500",
                      value.color,
                      "group-hover:scale-110"
                    )} />
                  </div>
                  
                  {/* Title */}
                  <h3 className={cn(
                    "font-serif font-bold text-xl md:text-2xl mb-3 transition-colors duration-300",
                    value.color,
                    "group-hover:text-primary"
                  )}>
                    {value.name}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    {value.description}
                  </p>
                  
                  {/* Decorative Element */}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                    <div className={cn(
                      "w-1 h-1 rounded-full transition-all duration-300 group-hover:w-3",
                      value.color.replace('text-', 'bg-')
                    )} />
                    <span className="text-xs text-gray-400 uppercase tracking-wider">Core Principle</span>
                    <Sparkles className={cn(
                      "h-3 w-3 opacity-0 group-hover:opacity-100 transition-all duration-300",
                      value.color
                    )} />
                  </div>
                </div>
                
                {/* Corner Accent */}
                <div className={cn(
                  "absolute bottom-0 right-0 w-12 h-12 bg-gradient-to-tl opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-tl-2xl",
                  value.gradient
                )} />
              </Card>
            )
          })}
        </div>
        
        {/* Bottom Quote */}
        <div className="mt-16 text-center">
          <div className="inline-block bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-md border border-gray-100">
            <p className="text-sm text-gray-600 max-w-2xl">
              <span className="font-serif text-secondary text-lg">"</span>
              These values are not just words on a wall—they are lived, practiced, and celebrated every day 
              in our classrooms, on our playgrounds, and in our community.
              <span className="font-serif text-secondary text-lg">"</span>
            </p>
            <p className="text-xs text-primary font-medium mt-2">— Vincollins College Philosophy</p>
          </div>
        </div>
      </Container>

      <style jsx>{`
        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s ease infinite;
        }
        @keyframes float-particle {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          25% {
            transform: translateY(-15px) translateX(5px);
            opacity: 0.5;
          }
          50% {
            transform: translateY(-25px) translateX(10px);
            opacity: 0.8;
          }
          75% {
            transform: translateY(-15px) translateX(5px);
            opacity: 0.5;
          }
        }
        .animate-float-particle {
          animation: float-particle 8s ease-in-out infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </section>
  )
}

// Helper function for conditional classes
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}