// components/PrefetchLink.tsx
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ReactNode } from 'react'

interface PrefetchLinkProps {
  href: string
  children: ReactNode
  className?: string
}

export function PrefetchLink({ href, children, className }: PrefetchLinkProps) {
  const router = useRouter()

  const handleMouseEnter = () => {
    router.prefetch(href)
  }

  return (
    <Link 
      href={href} 
      className={className}
      onMouseEnter={handleMouseEnter}
      prefetch={true}
    >
      {children}
    </Link>
  )
}