// components/layout/header/Logo.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { GraduationCap } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export function Logo() {
  const [schoolLogo, setSchoolLogo] = useState<string | null>(null)

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const { data } = await supabase
          .from('school_settings')
          .select('logo_path')
          .single()
        if (data?.logo_path) {
          setSchoolLogo(data.logo_path)
        }
      } catch {
        // Silently fail - use default icon
      }
    }
    fetchLogo()
  }, [])

  return (
    <Link href="/" className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 group flex-shrink-0">
      <div className="relative group-hover:scale-105 transition-all duration-300">
        {schoolLogo ? (
          <div className="relative h-10 w-10 sm:h-11 sm:w-11 lg:h-12 lg:w-12 xl:h-14 xl:w-14">
            <Image 
              src={schoolLogo} 
              alt="Vincollins College Logo" 
              width={56}
              height={56}
              className="object-contain"
              priority
            />
          </div>
        ) : (
          <div className="relative h-10 w-10 sm:h-11 sm:w-11 lg:h-12 lg:w-12 xl:h-14 xl:w-14 bg-gradient-to-br from-[#0A2472] to-[#1e3a8a] rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl">
            <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
          </div>
        )}
      </div>
      <div className="flex flex-col">
        <div className="flex items-baseline gap-0.5 sm:gap-1">
          <span 
            className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white leading-tight tracking-wide group-hover:text-[#F5A623] transition-colors duration-300"
            style={{ fontFamily: 'var(--font-dancing-script), cursive' }}
          >
            Vincollins
          </span>
          <span 
            className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-[#F5A623] leading-tight tracking-wide"
            style={{ fontFamily: 'var(--font-dancing-script), cursive' }}
          >
            College
          </span>
        </div>
        <span className="text-[6px] xs:text-[7px] sm:text-[8px] md:text-[9px] lg:text-[10px] text-white/60 -mt-0.5 tracking-[0.15em] sm:tracking-[0.2em] font-medium uppercase border-t border-white/20 pt-0.5">
          Geared Towards Excellence
        </span>
      </div>
    </Link>
  )
}