// components/ui/CustomImage.tsx - IMPROVED VERSION
'use client'

import Image, { ImageProps } from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface CustomImageProps extends Omit<ImageProps, 'onLoadingComplete'> {
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void
  className?: string
}

export function CustomImage({ className, onLoad, ...props }: CustomImageProps) {
  const [loaded, setLoaded] = useState(false)
  
  return (
    <Image
      {...props}
      className={cn(className, loaded ? 'opacity-100' : 'opacity-0', 'transition-opacity duration-300')}
      onLoad={(e) => {
        setLoaded(true)
        if (onLoad) {
          onLoad(e)
        }
      }}
    />
  )
}