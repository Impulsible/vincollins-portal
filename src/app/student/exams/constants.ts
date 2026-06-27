// src/app/student/exams/constants.ts - COMPLETE FIXED VERSION

import {
  MonitorPlay, FileText, Award, BookOpen, Shield, PenTool,
  Hash, Target, Zap, TrendingUp, BarChart3, Music, 
  Palette, Globe, Languages, School, Calculator, Brain, 
  Trophy, Users, Briefcase, Film, Camera, Microscope,
  Database, Code, Cloud, Wifi, Lock, Key, Clock,
  Gift, Heart, Star, Sun, Moon, Leaf, Droplet,
  Flame, Compass, Map, Flag, Crown, Gem, Sparkles
} from 'lucide-react'
import type { SubjectConfig } from './types'

export const SUBJECT_CONFIG: Record<string, SubjectConfig> = {
  // ============================================
  // CORE SUBJECTS
  // ============================================
  'Mathematics': { icon: Hash, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  'English Language': { icon: BookOpen, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  'English Studies': { icon: BookOpen, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  'English': { icon: BookOpen, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  
  // ============================================
  // SCIENCE SUBJECTS
  // ============================================
  'Physics': { icon: Zap, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  'Chemistry': { icon: FileText, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  'Biology': { icon: Target, color: 'text-green-600', bgColor: 'bg-green-50' },
  'Basic Science': { icon: Zap, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  'Basic Technology': { icon: MonitorPlay, color: 'text-slate-600', bgColor: 'bg-slate-50' },
  'Agricultural Science': { icon: Leaf, color: 'text-green-600', bgColor: 'bg-green-50' },
  'Agric': { icon: Leaf, color: 'text-green-600', bgColor: 'bg-green-50' },
  
  // ============================================
  // SOCIAL SCIENCES
  // ============================================
  'Economics': { icon: TrendingUp, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  'Government': { icon: Shield, color: 'text-red-600', bgColor: 'bg-red-50' },
  'Social Studies': { icon: Globe, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  'Geography': { icon: Map, color: 'text-teal-600', bgColor: 'bg-teal-50' },
  'History': { icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  'Civic Education': { icon: Shield, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  
  // ============================================
  // ARTS & HUMANITIES
  // ============================================
  'Literature in English': { icon: PenTool, color: 'text-pink-600', bgColor: 'bg-pink-50' },
  'Literature': { icon: PenTool, color: 'text-pink-600', bgColor: 'bg-pink-50' },
  'Christian Religious Studies': { icon: BookOpen, color: 'text-sky-600', bgColor: 'bg-sky-50' },
  'CRS': { icon: BookOpen, color: 'text-sky-600', bgColor: 'bg-sky-50' },
  'Islamic Religious Studies': { icon: BookOpen, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  'IRS': { icon: BookOpen, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  'Cultural and Creative Arts': { icon: Palette, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  'Creative Arts': { icon: Palette, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  'CCA': { icon: Palette, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  
  // ============================================
  // MUSIC & PERFORMING ARTS
  // ============================================
  'Music': { icon: Music, color: 'text-pink-600', bgColor: 'bg-pink-50' },
  'Drama': { icon: Film, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  'Theatre Arts': { icon: Film, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  
  // ============================================
  // BUSINESS & COMMERCE
  // ============================================
  'Commerce': { icon: BarChart3, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  'Business Studies': { icon: Briefcase, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  'Financial Accounting': { icon: Calculator, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  'Accounting': { icon: Calculator, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  'Office Practice': { icon: Briefcase, color: 'text-slate-600', bgColor: 'bg-slate-50' },
  
  // ============================================
  // TECHNOLOGY & COMPUTING
  // ============================================
  'Information Technology': { icon: MonitorPlay, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  'IT': { icon: MonitorPlay, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  'Computer Science': { icon: MonitorPlay, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  'Data Processing': { icon: Database, color: 'text-gray-600', bgColor: 'bg-gray-50' },
  'ICT': { icon: Wifi, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  'Programming': { icon: Code, color: 'text-violet-600', bgColor: 'bg-violet-50' },
  
  // ============================================
  // LANGUAGES
  // ============================================
  'French': { icon: Languages, color: 'text-red-600', bgColor: 'bg-red-50' },
  'Yoruba': { icon: Languages, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  'Igbo': { icon: Languages, color: 'text-green-600', bgColor: 'bg-green-50' },
  'Hausa': { icon: Languages, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
  'Arabic': { icon: Languages, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  
  // ============================================
  // HOME ECONOMICS & VOCATIONAL
  // ============================================
  'Home Economics': { icon: School, color: 'text-pink-600', bgColor: 'bg-pink-50' },
  'Home Econ': { icon: School, color: 'text-pink-600', bgColor: 'bg-pink-50' },
  'Food and Nutrition': { icon: Heart, color: 'text-red-600', bgColor: 'bg-red-50' },
  'Clothing and Textile': { icon: Gem, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  
  // ============================================
  // PHYSICAL EDUCATION
  // ============================================
  'Physical and Health Education': { icon: Trophy, color: 'text-rose-600', bgColor: 'bg-rose-50' },
  'PHE': { icon: Trophy, color: 'text-rose-600', bgColor: 'bg-rose-50' },
  'Physical Education': { icon: Trophy, color: 'text-rose-600', bgColor: 'bg-rose-50' },
  'Sports': { icon: Trophy, color: 'text-rose-600', bgColor: 'bg-rose-50' },
  
  // ============================================
  // SECURITY & SAFETY
  // ============================================
  'Security Education': { icon: Shield, color: 'text-red-600', bgColor: 'bg-red-50' },
  'Security': { icon: Shield, color: 'text-red-600', bgColor: 'bg-red-50' },
  
  // ============================================
  // ADVANCED MATH
  // ============================================
  'Further Mathematics': { icon: Hash, color: 'text-violet-600', bgColor: 'bg-violet-50' },
  'Further Maths': { icon: Hash, color: 'text-violet-600', bgColor: 'bg-violet-50' },
  
  // ============================================
  // ADDITIONAL SUBJECTS
  // ============================================
  'Psychology': { icon: Brain, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  'Sociology': { icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  'Philosophy': { icon: BookOpen, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  'Logic': { icon: Brain, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  
  // ============================================
  // VOCATIONAL & PRACTICAL
  // ============================================
  'Woodwork': { icon: PenTool, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  'Metalwork': { icon: PenTool, color: 'text-gray-600', bgColor: 'bg-gray-50' },
  'Electronics': { icon: Zap, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  'Photography': { icon: Camera, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  'Catering': { icon: Heart, color: 'text-red-600', bgColor: 'bg-red-50' },
  
  // ============================================
  // SCIENCE LABS
  // ============================================
  'Science Lab': { icon: Microscope, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  'Laboratory': { icon: Microscope, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  'Practical': { icon: Target, color: 'text-green-600', bgColor: 'bg-green-50' },
}

export const TERM_NAMES: Record<string, string> = {
  first: 'First Term',
  second: 'Second Term',
  third: 'Third Term'
}

export const CURRENT_SESSION = '2025/2026'

export const DEFAULT_SUBJECT_CONFIG: SubjectConfig = {
  icon: BookOpen,
  color: 'text-gray-600',
  bgColor: 'bg-gray-50'
}