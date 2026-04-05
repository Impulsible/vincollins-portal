'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Container } from '@/components/layout/container'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { GraduationCap, BookOpen, Heart, Sparkles, ChevronRight, Users, TrendingUp, Star, Target, Globe, Shield, Calendar } from 'lucide-react'

const sections = [
  {
    title: 'Crèche/Playgroup',
    ageRange: '0-3 years',
    count: '22',
    description: 'A nurturing environment where our youngest learners develop through play-based activities, sensory experiences, and personalized attention in a safe, caring setting.',
    icon: Heart,
    gradient: 'from-rose-500 to-pink-600',
    lightColor: 'text-rose-600',
    bgLight: 'bg-rose-50',
    image: '/images/hero-creche.jpeg',
    features: ['Safe Environment', 'Early Learning', 'Play-based', 'Sensory Play'],
    slug: 'creche-playgroup',
    stats: '22 Active Students',
    accentColor: 'rose'
  },
  {
    title: 'Nursery',
    ageRange: '3-5 years',
    count: '54',
    description: 'Building foundational skills through structured activities, creative play, and social interaction, preparing children for a seamless transition to primary education.',
    icon: Sparkles,
    gradient: 'from-amber-500 to-orange-600',
    lightColor: 'text-amber-600',
    bgLight: 'bg-amber-50',
    image: '/images/hero-nursery.jpg',
    features: ['Activities', 'Rhymes', 'Real-life Experiences', 'Social Skills'],
    slug: 'nursery',
    stats: '54 Active Students',
    accentColor: 'amber'
  },
  {
    title: 'Primary',
    ageRange: '5-11 years',
    count: '65',
    description: 'Developing critical thinking and core academic skills through a comprehensive curriculum that balances traditional subjects with modern learning approaches.',
    icon: BookOpen,
    gradient: 'from-emerald-500 to-teal-600',
    lightColor: 'text-emerald-600',
    bgLight: 'bg-emerald-50',
    image: '/images/hero-primary.jpg',
    features: ['Core Skills', 'Critical Thinking', 'Character Building', 'STEM'],
    slug: 'primary',
    stats: '65 Active Students',
    accentColor: 'emerald'
  },
  {
    title: 'College',
    ageRange: '11-16 years',
    count: '51',
    description: 'Preparing students for future success with a challenging curriculum that develops leadership, independence, and academic excellence for higher education.',
    icon: GraduationCap,
    gradient: 'from-blue-600 to-indigo-700',
    lightColor: 'text-blue-600',
    bgLight: 'bg-blue-50',
    image: '/images/hero-college.jpeg',
    features: ['Balanced Curriculum', 'Future Ready', 'Leadership', 'Excellence'],
    slug: 'college',
    stats: '51 Active Students',
    accentColor: 'blue'
  },
]

const fallbackImage = '/images/placeholder-school.jpg'

export function SchoolSections() {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})

  const handleImageError = (title: string) => {
    setImageErrors(prev => ({ ...prev, [title]: true }))
  }

  const getImageSrc = (section: typeof sections[0]) => {
    if (imageErrors[section.title]) {
      return fallbackImage
    }
    return section.image
  }

  return (
    <section className="py-16 lg:py-24 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
      
      <Container className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Section Header - Compact */}
        <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16">
          <Badge className="bg-primary/10 text-primary border-0 px-4 py-1.5 text-sm font-semibold mb-4">
            Academic Programs
          </Badge>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            <span className="text-gray-900">Nurturing Excellence</span>
            <span className="text-primary block mt-1">At Every Stage</span>
          </h2>
          
          <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
            From early years to college preparation, discover our comprehensive programs designed for holistic development
          </p>
        </div>

        {/* Cards Grid - Optimized Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {sections.map((section, index) => {
            const Icon = section.icon
            return (
              <Card 
                key={section.title}
                className="group relative overflow-hidden border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 bg-white rounded-xl flex flex-col"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Image Container */}
                <div className="relative w-full h-48 bg-gray-100 overflow-hidden flex-shrink-0">
                  <Image
                    src={getImageSrc(section)}
                    alt={section.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    priority={index < 2}
                    onError={() => handleImageError(section.title)}
                  />
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  
                  {/* Age Badge - Bottom Left */}
                  <div className="absolute bottom-3 left-3 z-10">
                    <div className="bg-black/70 backdrop-blur-sm rounded-lg px-2.5 py-1">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 text-white" />
                        <span className="text-xs font-medium text-white">{section.ageRange}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Student Count Badge - Top Right */}
                  <div className="absolute top-3 right-3 z-10">
                    <div className="bg-white/95 backdrop-blur-sm rounded-lg px-2.5 py-1 shadow-sm">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3 w-3 text-primary" />
                        <span className="text-xs font-semibold text-gray-700">{section.stats}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <CardContent className="p-5 flex-1 flex flex-col">
                  {/* Title & Icon */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary transition-colors mb-1">
                        {section.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-px ${section.lightColor} opacity-50`} />
                        <span className="text-xs text-gray-500">{section.count} enrolled</span>
                      </div>
                    </div>
                    <div className={`p-2 rounded-lg ${section.bgLight} group-hover:scale-110 transition-transform flex-shrink-0 ml-2`}>
                      <Icon className={`h-4 w-4 ${section.lightColor}`} />
                    </div>
                  </div>
                  
                  {/* Description */}
                  <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-2">
                    {section.description}
                  </p>
                  
                  {/* Features Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {section.features.slice(0, 3).map((feature, i) => (
                      <span 
                        key={i} 
                        className="text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-md"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                  
                  {/* Learn More Link - Pushed to bottom */}
                  <div className="mt-auto pt-2">
                    <Link 
                      href={`/academics/${section.slug}`}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 group/link transition-all border-t border-gray-100 w-full pt-3"
                    >
                      <span>Learn more</span>
                      <ChevronRight className="h-3.5 w-3.5 group-hover/link:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
        
        {/* Bottom CTA - Enhanced Contrast */}
        <div className="text-center mt-12">
          <Link href="/schools">
            <Button 
              className="group px-8 py-6 text-base font-bold rounded-xl bg-gradient-to-r from-[#0A2472] to-[#1e3a8a] hover:from-[#0A2472] hover:to-[#0A2472] text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer"
            >
              <TrendingUp className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
              Explore All Academic Programs
              <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          
          {/* Trust Indicators - Compact */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span className="text-xs font-medium text-gray-600">Top Rated</span>
            </div>
            <div className="w-px h-4 bg-gray-200" />
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-gray-600">Accredited</span>
            </div>
            <div className="w-px h-4 bg-gray-200" />
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-secondary" />
              <span className="text-xs font-medium text-gray-600">Personalized</span>
            </div>
            <div className="w-px h-4 bg-gray-200" />
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-emerald-500" />
              <span className="text-xs font-medium text-gray-600">Global Standards</span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}