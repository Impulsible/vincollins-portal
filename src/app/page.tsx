import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Hero } from '@/components/home/hero'
import { SchoolSections } from '@/components/home/school-sections'
import { VisionMission } from '@/components/home/vision-mission'
import { Values } from '@/components/home/values'
import { StatsBar } from '@/components/home/stats-bar'
import { CTA } from '@/components/home/cta'

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <StatsBar />
        <SchoolSections />
        <VisionMission />
        <Values />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}