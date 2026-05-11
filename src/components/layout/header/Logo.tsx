// components/layout/header/Logo.tsx
'use client'

import { memo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { GraduationCap } from 'lucide-react'
import { SchoolSettings } from './types'

export const Logo = memo(function Logo({ schoolSettings }: { schoolSettings: SchoolSettings | null }) {
  return (
    <Link href="/" className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 group flex-shrink-0">
      <div className="relative group-hover:scale-105 transition-all duration-300">
        {schoolSettings?.logo_path ? (
          <div className="relative h-10 w-10 sm:h-11 sm:w-11 lg:h-12 lg:w-12">
            <Image 
              src={schoolSettings.logo_path} 
              alt={schoolSettings.school_name || 'Vincollins College Logo'} 
              width={48} height={48} 
              className="object-contain" 
              priority 
            />
          </div>
        ) : (
          <div className="h-10 w-10 sm:h-11 sm:w-11 lg:h-12 lg:w-12 bg-gradient-to-br from-[#0A2472] to-[#1e3a8a] rounded-xl flex items-center justify-center shadow-lg">
            <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
          </div>
        )}
      </div>
      <div className="flex flex-col">
        <div className="flex items-baseline gap-1">
          <span 
            className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white tracking-wide group-hover:text-[#F5A623] transition-colors duration-300"
            style={{ fontFamily: 'var(--font-dancing-script), cursive' }}
          >
            Vincollins
          </span>
          <span 
            className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-[#F5A623] tracking-wide"
            style={{ fontFamily: 'var(--font-dancing-script), cursive' }}
          >
            College
          </span>
        </div>
        <span className="text-[8px] sm:text-[9px] lg:text-[10px] text-white/60 -mt-0.5 tracking-[0.15em] sm:tracking-[0.2em] font-medium uppercase border-t border-white/20 pt-0.5">
          Geared Towards Excellence
        </span>
      </div>
    </Link>
  )
})