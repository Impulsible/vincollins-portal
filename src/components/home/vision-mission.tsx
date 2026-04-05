/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { Card } from '@/components/ui/card'
import { Container } from '@/components/layout/container'
import { Target, Trophy, Globe, BookOpen, GraduationCap, Eye, Lightbulb, CheckCircle, TrendingUp } from 'lucide-react'

export function VisionMission() {
  return (
    <section className="py-16 sm:py-20 lg:py-28 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      
      <Container className="px-4 sm:px-6 max-w-7xl mx-auto relative">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-primary" />
            <span className="text-sm font-semibold text-primary/80 uppercase tracking-wider">Our Foundation</span>
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-primary" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            <span className="text-[#0A2472]">Vision & </span>
            <span className="text-secondary">Mission</span>
          </h2>
          <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
            Guiding principles that shape our educational philosophy and drive our commitment to excellence
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Vision Card */}
          <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white rounded-2xl hover:-translate-y-2">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl" />
            
            {/* Top Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left" />
            
            <div className="relative p-6 sm:p-8 lg:p-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-primary/10 rounded-xl group-hover:scale-110 transition-transform duration-300 group-hover:rotate-3">
                  <Eye className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#0A2472]">Our Vision</h3>
                  <div className="w-12 h-0.5 bg-primary mt-2 group-hover:w-24 transition-all duration-500" />
                </div>
              </div>
              
              <p className="text-base sm:text-lg leading-relaxed text-gray-700 mb-6">
                To nurture <span className="font-semibold text-primary">happy, successful children</span> by providing a positive, 
                safe and stimulating environment where every child is valued and empowered to become an 
                independent, life-long learner.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-primary/5 to-transparent p-4 rounded-xl border border-primary/10 group-hover:border-primary/20 transition-all">
                  <p className="text-2xl sm:text-3xl font-bold text-primary">25+</p>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">Years of Excellence</p>
                </div>
                <div className="bg-gradient-to-br from-primary/5 to-transparent p-4 rounded-xl border border-primary/10 group-hover:border-primary/20 transition-all">
                  <p className="text-2xl sm:text-3xl font-bold text-primary">100%</p>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">Pass Rate</p>
                </div>
              </div>

              {/* Key Principles */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs text-gray-600">Holistic Development</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs text-gray-600">Safe Environment</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs text-gray-600">Life-long Learning</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Mission Card */}
          <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white rounded-2xl hover:-translate-y-2">
            <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
            
            {/* Top Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-secondary via-primary to-secondary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left" />
            
            <div className="relative p-6 sm:p-8 lg:p-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-secondary/10 rounded-xl group-hover:scale-110 transition-transform duration-300 group-hover:-rotate-3">
                  <Lightbulb className="h-7 w-7 sm:h-8 sm:w-8 text-secondary" />
                </div>
                <div>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#0A2472]">Our Mission</h3>
                  <div className="w-12 h-0.5 bg-secondary mt-2 group-hover:w-24 transition-all duration-500" />
                </div>
              </div>
              
              <div className="mb-6">
                <p className="font-['Dancing_Script',cursive] text-3xl sm:text-4xl text-secondary mb-3 leading-tight">
                  Dream, Believe, Achieve.
                </p>
                <div className="w-16 h-px bg-gradient-to-r from-secondary to-transparent" />
              </div>
              
              <p className="text-base sm:text-lg leading-relaxed text-gray-700 mb-6">
                To provide students with <span className="font-semibold text-secondary">high-quality learning experiences</span> 
                through a broad, balanced curriculum that prepares them for adult responsibility in the modern world.
              </p>
              
              <div className="flex flex-wrap items-center gap-6 pt-2">
                <div className="flex items-center gap-2 group/item hover:scale-105 transition-transform">
                  <div className="p-1.5 bg-secondary/10 rounded-lg">
                    <Globe className="h-4 w-4 text-secondary" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Global Perspective</span>
                </div>
                <div className="flex items-center gap-2 group/item hover:scale-105 transition-transform">
                  <div className="p-1.5 bg-secondary/10 rounded-lg">
                    <BookOpen className="h-4 w-4 text-secondary" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Balanced Curriculum</span>
                </div>
                <div className="flex items-center gap-2 group/item hover:scale-105 transition-transform">
                  <div className="p-1.5 bg-secondary/10 rounded-lg">
                    <GraduationCap className="h-4 w-4 text-secondary" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Future Ready</span>
                </div>
              </div>

              {/* Stats Row */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-secondary" />
                    <span className="text-xs text-gray-600">98% Success Rate</span>
                  </div>
                  <div className="w-px h-4 bg-gray-200" />
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-secondary" />
                    <span className="text-xs text-gray-600">Excellence Award</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </Container>
    </section>
  )
}