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
  CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function CTA() {
  const containerRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  })
  
  const opacity = useTransform(scrollYProgress, [0, 1], [0.6, 0.2])
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1])

  const stats = [
    { 
      icon: Users, 
      value: "500+", 
      label: "Happy Students", 
      description: "Growing community",
      color: "text-secondary",
      bgColor: "bg-secondary/20",
      delay: 0
    },
    { 
      icon: GraduationCap, 
      value: "98%", 
      label: "Success Rate", 
      description: "Academic excellence",
      color: "text-accent",
      bgColor: "bg-accent/20",
      delay: 1
    },
    { 
      icon: Award, 
      value: "25+", 
      label: "Years of Excellence", 
      description: "Since 1995",
      color: "text-secondary",
      bgColor: "bg-secondary/20",
      delay: 2
    },
  ]

  const benefits = [
    { icon: CheckCircle, text: "Quality Education" },
    { icon: Heart, text: "Nurturing Environment" },
    { icon: Globe, text: "Global Standards" },
    { icon: TrendingUp, text: "Future Ready" },
  ]

  return (
    <section 
      ref={containerRef}
      className="relative overflow-hidden py-16 sm:py-20 md:py-24 lg:py-28"
    >
      {/* Background with Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0A2472] via-[#0A2472] to-[#1e3a8a]" />
      
      {/* Animated Background Elements */}
      <motion.div 
        style={{ opacity, scale }}
        className="absolute inset-0"
      >
        <div className="absolute top-0 right-0 w-[300px] sm:w-[400px] md:w-[500px] h-[300px] sm:h-[400px] md:h-[500px] bg-secondary/30 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 left-0 w-[300px] sm:w-[400px] md:w-[500px] h-[300px] sm:h-[400px] md:h-[500px] bg-accent/30 rounded-full blur-3xl animate-pulse-slow animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[600px] md:w-[800px] h-[500px] sm:h-[600px] md:h-[800px] bg-white/5 rounded-full blur-3xl" />
      </motion.div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('/images/grid.svg')] opacity-5 bg-repeat" />
      
      {/* Top Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-secondary to-transparent" />
      
      <Container className="relative px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto"
        >
          {/* Sparkle Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            viewport={{ once: true }}
            className="flex justify-center"
          >
            <Badge className="mb-4 sm:mb-6 bg-white/20 backdrop-blur-sm text-white border border-white/30 px-3 sm:px-5 py-1.5 sm:py-2 hover:bg-white/30 transition-all duration-300 shadow-lg">
              <Sparkles className="h-3 w-3 mr-1.5 sm:mr-2 animate-pulse" />
              <span className="text-xs sm:text-sm font-medium">Join Our Community Today</span>
            </Badge>
          </motion.div>
          
          {/* Main Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 px-4">
              <span className="bg-gradient-to-r from-white via-secondary to-white bg-clip-text text-transparent bg-200% animate-gradient">
                Join the Vincollins Community
              </span>
            </h2>
            <div className="w-20 sm:w-24 h-1 bg-gradient-to-r from-secondary to-accent mx-auto mb-4 sm:mb-6 rounded-full" />
          </motion.div>
          
          {/* Description */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            viewport={{ once: true }}
            className="text-base sm:text-lg md:text-xl text-white/90 mb-8 sm:mb-10 leading-relaxed max-w-3xl mx-auto text-center px-4"
          >
            Experience excellence in education. Apply now to begin your journey with Vincollins College and 
            become part of a community that nurtures future leaders.
          </motion.p>
          
          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 md:gap-5 mb-12 sm:mb-14 md:mb-16 px-4"
          >
            <Link href="/admission" className="w-full sm:w-auto">
              <Button 
                size="lg" 
                className="w-full sm:w-auto bg-secondary hover:bg-secondary/90 text-white text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 group shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl font-semibold"
              >
                <GraduationCap className="mr-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:rotate-12 transition-transform" />
                Apply Now
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/contact" className="w-full sm:w-auto">
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full sm:w-auto bg-transparent text-white border-2 border-white/50 hover:border-white hover:bg-white/10 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 group rounded-xl font-semibold backdrop-blur-sm"
              >
                <Calendar className="mr-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:scale-110 transition-transform" />
                Schedule a Visit
              </Button>
            </Link>
          </motion.div>

          {/* Benefits Row - Mobile Responsive */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.6 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 mb-8 sm:mb-10 md:mb-12 px-4"
          >
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <div 
                  key={index}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 rounded-full backdrop-blur-sm border border-white/20"
                >
                  <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-secondary" />
                  <span className="text-[10px] sm:text-xs text-white/80 font-medium whitespace-nowrap">{benefit.text}</span>
                </div>
              )
            })}
          </motion.div>

          {/* Quick Stats - Responsive Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mb-10 sm:mb-12 px-4"
          >
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <motion.div 
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + (stat.delay * 0.1), duration: 0.5 }}
                  viewport={{ once: true }}
                  className="text-center group"
                >
                  <div className={cn(
                    "inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl mb-3 sm:mb-4 transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl mx-auto",
                    stat.bgColor,
                    "backdrop-blur-sm"
                  )}>
                    <Icon className={cn("h-6 w-6 sm:h-7 sm:w-7", stat.color)} />
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-white mb-0.5 sm:mb-1">{stat.value}</p>
                  <p className="text-xs sm:text-sm font-semibold text-white/90">{stat.label}</p>
                  <p className="text-[10px] sm:text-xs text-white/60 mt-0.5 sm:mt-1">{stat.description}</p>
                </motion.div>
              )
            })}
          </motion.div>

          {/* Contact Info Cards - Responsive */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 pt-6 sm:pt-8 border-t border-white/20 px-4"
          >
            <Link 
              href="tel:+2348001234567" 
              className="flex items-center justify-center sm:justify-start gap-3 text-white/80 hover:text-white transition-all duration-300 group hover:translate-y-[-2px] p-3 sm:p-4 rounded-xl hover:bg-white/5"
            >
              <div className="p-2 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors">
                <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-secondary" />
              </div>
              <div className="text-left">
                <p className="text-[10px] sm:text-xs text-white/60">Call Us</p>
                <span className="text-xs sm:text-sm font-medium">+234 800 123 4567</span>
              </div>
            </Link>
            <Link 
              href="mailto:info@vincollins.edu.ng" 
              className="flex items-center justify-center sm:justify-start gap-3 text-white/80 hover:text-white transition-all duration-300 group hover:translate-y-[-2px] p-3 sm:p-4 rounded-xl hover:bg-white/5"
            >
              <div className="p-2 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors">
                <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-secondary" />
              </div>
              <div className="text-left">
                <p className="text-[10px] sm:text-xs text-white/60">Email Us</p>
                <span className="text-xs sm:text-sm font-medium">info@vincollins.edu.ng</span>
              </div>
            </Link>
            <Link 
              href="https://maps.google.com" 
              target="_blank"
              className="flex items-center justify-center sm:justify-start gap-3 text-white/80 hover:text-white transition-all duration-300 group hover:translate-y-[-2px] p-3 sm:p-4 rounded-xl hover:bg-white/5 sm:col-span-2 md:col-span-1"
            >
              <div className="p-2 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors">
                <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-secondary" />
              </div>
              <div className="text-left">
                <p className="text-[10px] sm:text-xs text-white/60">Visit Us</p>
                <span className="text-xs sm:text-sm font-medium">Lagos, Nigeria</span>
              </div>
            </Link>
          </motion.div>

          {/* Additional CTA Text */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mt-8 sm:mt-10 px-4"
          >
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/5 rounded-full backdrop-blur-sm">
              <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-secondary animate-pulse" />
              <p className="text-[10px] sm:text-xs text-white/70">
                Limited seats available for the upcoming academic session
              </p>
            </div>
          </motion.div>
        </motion.div>
      </Container>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-20 sm:h-24 md:h-32 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
    </section>
  )
}