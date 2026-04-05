// components/admin/layouts/Footer.tsx
'use client'

import { Heart, Github, Twitter, Linkedin, Mail, Globe } from 'lucide-react'
import Link from 'next/link'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>© {currentYear} Vincollins College</span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center gap-1">
              Made with <Heart className="h-3 w-3 text-red-500 animate-pulse" /> for education
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <Link 
              href="#" 
              className="text-muted-foreground hover:text-primary transition-colors"
              target="_blank"
            >
              <Globe className="h-4 w-4" />
            </Link>
            <Link 
              href="#" 
              className="text-muted-foreground hover:text-primary transition-colors"
              target="_blank"
            >
              <Mail className="h-4 w-4" />
            </Link>
            <Link 
              href="#" 
              className="text-muted-foreground hover:text-primary transition-colors"
              target="_blank"
            >
              <Twitter className="h-4 w-4" />
            </Link>
            <Link 
              href="#" 
              className="text-muted-foreground hover:text-primary transition-colors"
              target="_blank"
            >
              <Linkedin className="h-4 w-4" />
            </Link>
            <Link 
              href="#" 
              className="text-muted-foreground hover:text-primary transition-colors"
              target="_blank"
            >
              <Github className="h-4 w-4" />
            </Link>
          </div>
          
          <div className="text-xs text-muted-foreground">
            <span>Version 2.0.0</span>
            <span className="mx-2">•</span>
            <span>Secure Portal</span>
          </div>
        </div>
      </div>
    </footer>
  )
}