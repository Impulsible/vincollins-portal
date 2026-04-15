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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <main className="flex-1 flex items-center justify-center pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-primary/10 mb-4">
                <FileQuestion className="h-14 w-14 text-primary" />
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  name="search"
                  type="search"
                  placeholder="Search..."
                  className="pl-10 pr-24 py-6 rounded-full"
                />
                <Button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full"
                >
                  Search
                </Button>
              </form>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
              <Button onClick={() => router.push('/')}>
                <Home className="mr-2 h-5 w-5" />
                Home
              </Button>

              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-5 w-5" />
                Back
              </Button>
            </div>

            {/* Quick links */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center justify-center gap-2">
                  <Compass className="h-5 w-5 text-primary" />
                  Quick Links
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {quickLinks.map((link) => (
                    <Link
                      key={link.name}
                      href={link.href}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-primary/10"
                    >
                      <link.icon className="h-5 w-5" />
                      <span className="text-sm">{link.name}</span>
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