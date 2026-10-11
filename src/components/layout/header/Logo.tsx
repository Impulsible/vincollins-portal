'use client'

import { memo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { SchoolSettings } from './types'

export const Logo = memo(function Logo({ schoolSettings }: { schoolSettings: SchoolSettings | null }) {
  const getLogoPath = (): string => {
    const path = schoolSettings?.logo_path;
    
    if (!path) return '/images/logo.png';
    if (path.startsWith('http')) return path;
    if (path.startsWith('/images/')) return path;
    if (path.startsWith('/')) return `/images${path}`;
    return `/images/${path}`;
  };

  const logoSrc = getLogoPath();

  return (
    <Link href="/" className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 group shrink min-w-0">
      <div className="relative group-hover:scale-105 transition-all duration-300 shrink-0">
        <div className="relative h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12">
          <Image 
            src={logoSrc}
            alt={schoolSettings?.school_name || 'Vincollins College Logo'} 
            width={48} 
            height={48} 
            className="object-contain h-full w-full" 
            priority 
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/logo.png';
            }}
          />
        </div>
      </div>
      <div className="flex flex-col min-w-0">
        <div className="flex items-baseline gap-1 truncate">
          <span 
            className="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold text-white tracking-wide group-hover:text-[#F5A623] transition-colors duration-300 truncate"
            style={{ fontFamily: 'var(--font-dancing-script), cursive' }}
          >
            Vincollins
          </span>
          <span 
            className="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold text-[#F5A623] tracking-wide"
            style={{ fontFamily: 'var(--font-dancing-script), cursive' }}
          >
            College
          </span>
        </div>
        <span className="hidden sm:block text-[8px] sm:text-[9px] lg:text-[10px] text-white/60 -mt-0.5 tracking-[0.15em] sm:tracking-[0.2em] font-medium uppercase border-t border-white/20 pt-0.5 truncate">
          Geared Towards Excellence
        </span>
      </div>
    </Link>
  )
})