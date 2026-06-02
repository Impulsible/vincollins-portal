// app/about/page.tsx - FIXED WITH PROPER HEADER SPACING
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  School, Users, Award, Heart, Calendar, MapPin, 
  ChevronRight, Target, Eye, Play, Quote,
  Baby, Flower2, Book, GraduationCap, 
  Video, Library, Shield, Music, Camera,
  Building2, Trophy, UsersRound, Mic, Drama, Palette,
  Home, Sparkles, X, ChevronLeft, CheckCircle2,
  Clock, Coffee, ArrowRight, BookOpen
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { cn } from '@/lib/utils'

// ============================================
// PLACE YOUR SCHOOL IMAGES HERE
// ============================================

const schoolImages = {
  creche: '/images/schools/creche.jpg',
  nursery: '/images/schools/nursery.jpg',
  primary: '/images/schools/primary.jpg',
  college: '/images/schools/college.jpg',
}

const teamImages = {
  proprietor: '/images/team/mrs-joy-nnoli.jpg',
  director: '/images/team/mr-vincent-nnoli.jpg',
  admin: '/images/team/miss-ekeh-chinwendu.jpg',
}

// Latest Events (not blog links)
const latestEvents = [
  { 
    title: "Valentines Day 2023 Celebration", 
    date: "February 15, 2023", 
    description: "It was a colorful moment at Vincollins School with pupils and staff as they celebrate the month of love in touch of red and gold.",
    image: "/images/events/valentine.jpg",
    category: "Celebration"
  },
  { 
    title: "Christmas Party 2022", 
    date: "December 9, 2022", 
    description: "Vincollins Schools held its Christmas party with lots of activities, gifts, and fun moments for all students and staff.",
    image: "/images/events/christmas.jpg",
    category: "Celebration"
  },
  { 
    title: "Cultural Day 2023", 
    date: "April 6, 2023", 
    description: "Our cultural day was a successful one with parents, teachers, and pupils all dressed in cultural attire showcasing diversity.",
    image: "/images/events/cultural-day.jpg",
    category: "Cultural"
  },
  { 
    title: "Third Term Program 2022/2023", 
    date: "April 25, 2023", 
    description: "We welcome our wonderful pupils into Third Term Academic Session with exciting programs including Fruit Day and more.",
    image: "/images/events/term-program.jpg",
    category: "Academic"
  },
]

const campusGallery = [
  { src: '/images/gallery/graduation.jpg', title: 'Graduation Ceremony', category: 'Events' },
  { src: '/images/gallery/cultural-day.jpg', title: 'Cultural Day', category: 'Events' },
  { src: '/images/gallery/sports-day.jpg', title: 'Sports Day', category: 'Sports' },
  { src: '/images/gallery/classroom.jpg', title: 'Modern Classroom', category: 'Facilities' },
  { src: '/images/gallery/library.jpg', title: 'School Library', category: 'Facilities' },
  { src: '/images/gallery/science-lab.jpg', title: 'Science Lab', category: 'Facilities' },
  { src: '/images/gallery/computer-lab.jpg', title: 'Computer Lab', category: 'Facilities' },
  { src: '/images/gallery/art-class.jpg', title: 'Art Class', category: 'Activities' },
  { src: '/images/gallery/music-class.jpg', title: 'Music Class', category: 'Activities' },
]

// Hero image placeholder
const heroImage = '/images/campus/hero-bg.jpg'

// School sections data
const schoolSections = [
  { id: 'creche', title: 'Crèche/Playgroup', count: '22', age: '0-3 years', description: 'Designed to support early development for children below 3 years. Safe, secure, and nurturing environment.', image: schoolImages.creche, icon: Baby, color: 'pink', link: '/academics/creche-playgroup' },
  { id: 'nursery', title: 'Nursery', count: '54', age: '3-5 years', description: 'Curriculum full of activities, rhymes and real-life experiences that motivate children and provide a solid foundation.', image: schoolImages.nursery, icon: Flower2, color: 'emerald', link: '/academics/nursery' },
  { id: 'primary', title: 'Primary', count: '65', age: '5-11 years', description: 'Fundamental skills in reading, writing, and mathematics to establish a solid foundation for learning.', image: schoolImages.primary, icon: Book, color: 'blue', link: '/academics/primary' },
  { id: 'college', title: 'College', count: '22', age: '11-16 years', description: 'Challenging and balanced education preparing students for adult responsibility in the modern world.', image: schoolImages.college, icon: GraduationCap, color: 'purple', link: '/academics/college' },
]

// Junior College Subjects
const juniorSubjects = [
  'Mathematics', 'English Language', 'Civic Education', 'Basic Science', 'Basic Technology',
  'Yoruba', 'Computer', 'History', 'Social Studies', 'Agricultural Science',
  'Home Economics', 'Business Studies', 'French', 'Cultural and Creative Arts',
  'Physical Education', 'Security Education', 'Igbo'
]

// Senior College Subjects
const seniorSubjects = [
  'English Language', 'Mathematics', 'Further Mathematics', 'Civic Education', 'Data Processing',
  'Chemistry', 'Physics', 'Economics', 'Government', 'Book-keeping', 'Geography',
  'Home Economics', 'Computer', 'Biology', 'Commerce', 'History', 'Physical Education',
  'Agriculture', 'Technical Drawings', 'Christian Religious Studies', 'Islamic Studies',
  'Yoruba', 'Igbo', 'English Literature', 'Food and Nutrition', 'Clothing and Textiles',
  'Financial Accounting'
]

// Co-curricular Activities
const activities = [
  { name: 'Debating Society', icon: Mic, color: 'bg-blue-100 text-blue-600' },
  { name: 'Drama Club', icon: Drama, color: 'bg-purple-100 text-purple-600' },
  { name: 'Art Club', icon: Palette, color: 'bg-pink-100 text-pink-600' },
  { name: 'Music Club', icon: Music, color: 'bg-emerald-100 text-emerald-600' },
  { name: 'Football Club', icon: Trophy, color: 'bg-green-100 text-green-600' },
  { name: 'Taekwando', icon: Shield, color: 'bg-red-100 text-red-600' },
  { name: 'Scout', icon: Users, color: 'bg-cyan-100 text-cyan-600' },
  { name: 'Red Cross', icon: Heart, color: 'bg-rose-100 text-rose-600' },
  { name: 'Press Club', icon: Camera, color: 'bg-slate-100 text-slate-600' },
]

// Facilities
const facilities = [
  { name: 'Audio-Visual Aids', icon: Video, desc: 'Modern teaching equipment' },
  { name: 'Qualified Teachers', icon: Users, desc: 'Experienced educators' },
  { name: 'Well-stocked Library', icon: Library, desc: 'Rich learning resources' },
  { name: 'Sick Bay', icon: Heart, desc: 'Health care facility' },
  { name: 'CCTV Security', icon: Shield, desc: '24/7 surveillance' },
]

// Exams offered
const examsOffered = [
  'BECE', 'SSCE', 'WASSCE', 'JAMB', 'NECO'
]

// Management Team
const managementTeam = [
  { name: 'Mrs Joy Nnoli', title: 'Proprietress', role: 'Founder & Proprietress', image: teamImages.proprietor },
  { name: 'Mr Vincent Nnoli', title: 'Director', role: 'Director of Operations', image: teamImages.director },
  { name: 'Miss. Ekeh Chinwendu C.', title: 'Administrator/Accounts', role: 'Administrator & Accounts', image: teamImages.admin },
]

// Stats
const stats = [
  { value: '500+', label: 'Students', icon: Users },
  { value: '50+', label: 'Staff', icon: UsersRound },
  { value: '15+', label: 'Classrooms', icon: Building2 },
  { value: '4+', label: 'Years', icon: Calendar },
]

// Image Lightbox
function ImageLightbox({ images, initialIndex, onClose }: { images: typeof campusGallery; initialIndex: number; onClose: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') setCurrentIndex(prev => prev > 0 ? prev - 1 : images.length - 1)
      if (e.key === 'ArrowRight') setCurrentIndex(prev => prev < images.length - 1 ? prev + 1 : 0)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [images.length, onClose])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center"
        onClick={onClose}
      >
        <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20">
          <X className="h-6 w-6 text-white" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); setCurrentIndex(prev => prev > 0 ? prev - 1 : images.length - 1); }} className="absolute left-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20">
          <ChevronLeft className="h-6 w-6 text-white" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); setCurrentIndex(prev => prev < images.length - 1 ? prev + 1 : 0); }} className="absolute right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20">
          <ChevronRight className="h-6 w-6 text-white" />
        </button>
        <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
          <Image src={images[currentIndex].src} alt={images[currentIndex].title} width={1200} height={800} className="object-contain rounded-lg" />
          <div className="absolute bottom-4 left-0 right-0 text-center text-white bg-black/50 py-2 rounded-lg mx-auto w-fit px-4">
            <p className="text-sm font-medium">{images[currentIndex].title}</p>
            <p className="text-xs text-white/70">{images[currentIndex].category}</p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function AboutPage() {
  const [scrolled, setScrolled] = useState(false)
  const [selectedImage, setSelectedImage] = useState<number | null>(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      {/* Header - Fixed */}
      <div className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled ? "bg-white/95 backdrop-blur-md shadow-lg" : "bg-transparent"
      )}>
        <Header />
      </div>

      {/* Hero Section - With proper top padding to avoid header overlap */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden pt-16 sm:pt-[72px]">
        <div className="absolute inset-0 z-0">
          <Image 
            src={heroImage} 
            alt="Vincollins College Campus" 
            fill 
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/40 z-10" />
        </div>
        
        <div className="relative z-20 container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="mb-6 bg-white/20 text-white border-0 px-4 py-1.5 backdrop-blur-sm">
              Established 2022
            </Badge>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4">
              Welcome to Vincollins Schools
            </h1>
            <p className="text-xl md:text-2xl text-[#F5A623] font-semibold">
              Lagos, Nigeria — Geared Towards Excellence
            </p>
          </motion.div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent z-10" />
      </section>

      {/* Stats Banner */}
      <section className="py-12 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="inline-flex h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 items-center justify-center mb-2">
                  <stat.icon className="h-5 w-5" />
                </div>
                <div className="text-2xl font-bold text-slate-800">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Schools Section - Beautiful Card Grid */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700">Our Institutions</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800">Our Great Institution</h2>
            <div className="w-20 h-1 bg-[#F5A623] mx-auto mt-4" />
            <p className="text-slate-500 mt-4 max-w-2xl mx-auto">
              These are the sections of our great institution
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {schoolSections.map((section, idx) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all hover:-translate-y-2"
              >
                <div className="relative h-56 w-full overflow-hidden">
                  <Image 
                    src={section.image} 
                    alt={section.title} 
                    fill 
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-[#F5A623] text-white">{section.count}+ Students</Badge>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", section.color === 'pink' ? 'bg-pink-100 text-pink-600' : section.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' : section.color === 'blue' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600')}>
                      <section.icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">{section.title}</h3>
                  </div>
                  <p className="text-slate-500 text-sm mb-3 line-clamp-3">{section.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Ages {section.age}</span>
                    <Link href={section.link}>
                      <Button variant="ghost" size="sm" className="text-[#F5A623] hover:text-[#F5A623] hover:bg-amber-50">
                        Learn More <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Aim & Objectives */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-amber-100 text-amber-700">Our Purpose</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800">Aim & Objective</h2>
            <div className="w-20 h-1 bg-[#F5A623] mx-auto mt-4" />
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-md">
              <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                Core Objectives
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" /><span className="text-slate-600">Provide sound qualitative and basic education</span></li>
                <li className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" /><span className="text-slate-600">Prepare students for SSCE, WASSCE, JAMB, NECO</span></li>
                <li className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" /><span className="text-slate-600">Prepare students for useful living in society</span></li>
                <li className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" /><span className="text-slate-600">Provide moral, social, cultural and physical education</span></li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-md">
              <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-purple-600" />
                Examinations
              </h3>
              <div className="flex flex-wrap gap-3">
                {examsOffered.map((exam, idx) => (
                  <Badge key={idx} className="bg-amber-100 text-amber-700 hover:bg-amber-200 px-4 py-2 text-sm">
                    {exam}
                  </Badge>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t">
                <p className="text-slate-600 text-sm">✓ Multi-cultural, multi-racial, non-discriminating</p>
                <p className="text-slate-600 text-sm mt-2">✓ Instilling discipline in the youth</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Curriculum */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-indigo-100 text-indigo-700">Academics</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800">Curriculum & Programs</h2>
            <div className="w-20 h-1 bg-[#F5A623] mx-auto mt-4" />
          </div>

          <Tabs defaultValue="junior" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
              <TabsTrigger value="junior">Junior College</TabsTrigger>
              <TabsTrigger value="senior">Senior College</TabsTrigger>
            </TabsList>

            <TabsContent value="junior">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {juniorSubjects.map((subject, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                    <BookOpen className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm text-slate-700">{subject}</span>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="senior">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {seniorSubjects.map((subject, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                    <BookOpen className="h-4 w-4 text-purple-500" />
                    <span className="text-sm text-slate-700">{subject}</span>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Co-curricular Activities */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-green-100 text-green-700">Beyond Academics</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800">Co-curricular Activities</h2>
            <div className="w-20 h-1 bg-[#F5A623] mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {activities.map((activity, idx) => (
              <motion.div key={activity.name} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }} className={cn("flex items-center gap-3 p-3 rounded-xl", activity.color)}>
                <activity.icon className="h-5 w-5" />
                <span className="text-sm font-medium">{activity.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Facilities */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-blue-100 text-blue-700">Our Attractions</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800">Available Facilities</h2>
            <div className="w-20 h-1 bg-[#F5A623] mx-auto mt-4" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {facilities.map((facility, idx) => (
              <div key={idx} className="flex items-start gap-4 p-5 bg-slate-50 rounded-xl">
                <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center"><facility.icon className="h-6 w-6 text-emerald-600" /></div>
                <div><h3 className="font-bold text-slate-800">{facility.name}</h3><p className="text-sm text-slate-500 mt-1">{facility.desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Events */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-amber-100 text-amber-700">Stay Updated</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800">Latest Events</h2>
            <div className="w-20 h-1 bg-[#F5A623] mx-auto mt-4" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {latestEvents.map((event, idx) => (
              <motion.div
                key={event.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all group"
              >
                <div className="relative h-48 w-full">
                  <Image src={event.image} alt={event.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  <Badge className="absolute top-3 right-3 bg-[#F5A623] text-white border-0">{event.category}</Badge>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-2"><Calendar className="h-3 w-3" />{event.date}</div>
                  <h3 className="font-bold text-slate-800 mb-2 line-clamp-2">{event.title}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2">{event.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Campus Gallery */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-purple-100 text-purple-700">Memories</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800">Campus Gallery</h2>
            <div className="w-20 h-1 bg-[#F5A623] mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {campusGallery.map((image, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }} className="group relative overflow-hidden rounded-xl cursor-pointer aspect-square" onClick={() => setSelectedImage(idx)}>
                <Image src={image.src} alt={image.title} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white transform translate-y-full group-hover:translate-y-0 transition-transform">
                  <p className="text-sm font-medium">{image.title}</p>
                  <p className="text-xs text-white/70">{image.category}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Management Team */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-blue-100 text-blue-700">Leadership</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800">Meet Our Management</h2>
            <div className="w-20 h-1 bg-[#F5A623] mx-auto mt-4" />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {managementTeam.map((member, idx) => (
              <div key={member.name} className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all group text-center">
                <div className="relative h-64 w-full">
                  <Image src={member.image} alt={member.name} fill className="object-cover group-hover:scale-105 transition-transform" />
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-xl text-slate-800">{member.name}</h3>
                  <p className="text-emerald-600 font-medium mt-1">{member.title}</p>
                  <p className="text-sm text-slate-500 mt-2">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* School Information */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-slate-50 text-center"><Clock className="h-10 w-10 text-[#F5A623] mx-auto mb-3" /><h3 className="text-xl font-bold mb-2">School Sessions</h3><p className="text-slate-600 text-sm">Opens 7:15am • Closes 4:00pm</p><p className="text-slate-500 text-xs mt-1">Students must arrive by 7:30am</p></div>
            <div className="p-6 rounded-xl bg-slate-50 text-center"><Shield className="h-10 w-10 text-[#F5A623] mx-auto mb-3" /><h3 className="text-xl font-bold mb-2">School Uniform</h3><p className="text-slate-600 text-sm">Only branded uniforms allowed</p><p className="text-slate-500 text-xs mt-1">No slippers or assorted shoes</p></div>
            <div className="p-6 rounded-xl bg-slate-50 text-center"><Coffee className="h-10 w-10 text-[#F5A623] mx-auto mb-3" /><h3 className="text-xl font-bold mb-2">Mid Day Meal</h3><p className="text-slate-600 text-sm">Bring food from home</p><p className="text-slate-500 text-xs mt-1">Snacks available at school shop</p></div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Image Lightbox */}
      <AnimatePresence>{selectedImage !== null && <ImageLightbox images={campusGallery} initialIndex={selectedImage} onClose={() => setSelectedImage(null)} />}</AnimatePresence>
    </>
  )
}