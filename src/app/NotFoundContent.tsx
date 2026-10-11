/* eslint-disable react/no-unescaped-entities */
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Home,
  ArrowLeft,
  Search,
  Compass,
  GraduationCap,
  MonitorPlay,
  Phone,
  BookOpen,
  FileQuestion
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

export default function NotFoundContent() {
  const router = useRouter()

  const quickLinks = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Student Portal', href: '/student', icon: GraduationCap },
    { name: 'CBT Platform', href: '/cbt', icon: MonitorPlay },
    { name: 'Library', href: '/library', icon: BookOpen },
    { name: 'Contact Us', href: '/contact', icon: Phone },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300">
      <main className="flex-1 flex items-center justify-center pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            {/* Icon */}
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 mb-4">
                <FileQuestion className="h-12 w-12 sm:h-14 sm:w-14 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>

            {/* Heading */}
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-slate-800 dark:text-white">
              Page Not Found
            </h1>

            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-lg mx-auto mb-8">
              The page you're looking for doesn't exist or has been moved.
            </p>

            {/* Search */}
            <div className="max-w-md mx-auto mb-8">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const formData = new FormData(e.currentTarget)
                  const query = formData.get('search') as string
                  if (query) router.push(`/search?q=${encodeURIComponent(query)}`)
                }}
                className="relative"
              >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
                <Input
                  name="search"
                  type="search"
                  placeholder="Search..."
                  className="pl-10 pr-24 py-6 rounded-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-emerald-400 dark:focus:border-emerald-500"
                />
                <Button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                >
                  Search
                </Button>
              </form>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
              <Button 
                onClick={() => router.push('/')}
                className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
              >
                <Home className="mr-2 h-5 w-5" />
                Home
              </Button>

              <Button 
                variant="outline" 
                onClick={() => router.back()}
                className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Back
              </Button>
            </div>

            {/* Quick links */}
            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center justify-center gap-2 text-slate-800 dark:text-slate-100">
                  <Compass className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  Quick Links
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {quickLinks.map((link) => (
                    <Link
                      key={link.name}
                      href={link.href}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl transition-colors text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-400"
                    >
                      <link.icon className="h-5 w-5" />
                      <span className="text-sm text-center">{link.name}</span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

          </motion.div>
        </div>
      </main>
    </div>
  )
}