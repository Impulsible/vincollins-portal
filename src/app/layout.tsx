// src/app/layout.tsx
import { Suspense } from 'react';
import type { Metadata, Viewport } from 'next';
import { Inter, Dancing_Script, Playfair_Display } from 'next/font/google';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Providers } from '@/components/providers';
import { cn } from '@/lib/utils';
import { ProgressBar } from '@/components/ProgressBar';
import { GlobalLoadingWrapper } from '@/components/GlobalLoadingWrapper';
import { UserProvider } from '@/contexts/UserContext';
import { Header } from '@/components/layout/header';
import { Loader2 } from 'lucide-react';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial', 'sans-serif'],
});

const dancingScript = Dancing_Script({ 
  subsets: ['latin'],
  variable: '--font-dancing-script',
  display: 'swap',
  preload: false,
  fallback: ['cursive', 'Brush Script MT'],
});

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  preload: false,
  fallback: ['Georgia', 'serif'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0A2472' },
    { media: '(prefers-color-scheme: dark)', color: '#0A2472' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL('https://vincollinsschools.org'),
  title: {
    default: 'Vincollins Schools | Affordable Quality Education in Lagos',
    template: '%s | Vincollins Schools',
  },
  description: 'Vincollins Schools in Lagos offers Nursery (1-5 yrs), Primary (5-11 yrs), and College (11-17 yrs) education.',
  keywords: [
    'Vincollins Schools', 'schools in Lagos', 'Lagos Nigeria schools', 'Nursery school Lagos',
    'Primary school Lagos', 'College Lagos', 'affordable education Nigeria',
    'best schools in Lagos', 'private schools Nigeria'
  ],
  authors: [{ name: 'Mrs. Joy Adaobi Nnoli' }],
  creator: 'Vincollins Schools',
  publisher: 'Vincollins Schools',
  formatDetection: { 
    email: false, 
    address: false, 
    telephone: false 
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    url: 'https://vincollinsschools.org',
    siteName: 'Vincollins Schools',
    title: 'Vincollins Schools | Affordable Quality Education in Lagos',
    description: 'Vincollins Schools offers Nursery, Primary, and College education.',
    images: [{ url: '/images/og-image.jpg', width: 1200, height: 630, alt: 'Vincollins Schools Campus' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vincollins Schools | Lagos',
    description: 'Affordable, convenient, and excellent education.',
    images: ['/images/twitter-image.jpg'],
    creator: '@vincollins',
    site: '@vincollins',
  },
  icons: {
    icon: [
      { url: '/favicon.png', sizes: 'any', type: 'image/png' },
      { url: '/images/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/images/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/images/icons/apple-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: ['/favicon.png'],
  },
  manifest: '/manifest.json',
  alternates: { canonical: 'https://vincollinsschools.org' },
  category: 'education',
  classification: 'Private Educational Institution',
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
  },
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  name: 'Vincollins Schools',
  alternateName: 'Vincollins',
  url: 'https://vincollinsschools.org',
  logo: 'https://vincollinsschools.org/images/logo.png',
  image: 'https://vincollinsschools.org/images/og-image.jpg',
  description: 'Vincollins Schools offers affordable, convenient, and excellent educational background for children in Lagos.',
  founder: {
    '@type': 'Person',
    name: 'Mrs. Joy Adaobi Nnoli',
    jobTitle: 'Proprietress',
  },
  address: { '@type': 'PostalAddress', addressLocality: 'Lagos', addressCountry: 'NG' },
  foundingDate: '2019',
  knowsAbout: ['Early Years Education', 'Primary Education', 'Secondary Education', 'Financial Literacy'],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Academic Programs',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'EducationalOccupationalProgram',
          name: 'Nursery',
          educationalCredentialAwarded: 'Early Years Foundation',
          description: 'Early Years (1–5 Yrs).',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'EducationalOccupationalProgram',
          name: 'Primary',
          educationalCredentialAwarded: 'Primary School Leaving Certificate',
          description: 'Primary Years (5–11 yrs).',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'EducationalOccupationalProgram',
          name: 'College',
          educationalCredentialAwarded: 'Secondary School Certificate',
          description: 'College Years (11–17 yrs).',
        },
      },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html 
      lang="en" 
      className={cn(
        GeistSans.variable,
        GeistMono.variable,
        inter.variable,
        dancingScript.variable,
        playfair.variable,
        "font-sans"
      )}
      suppressHydrationWarning
    >
      <head>
        <meta name="format-detection" content="telephone=no, email=no, address=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://mvittkvxtasayycmzgha.supabase.co" />
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Vincollins Schools" />
        <meta name="msapplication-TileColor" content="#0A2472" />
      </head>
      <body 
        className={cn(
          GeistSans.className,
          "antialiased bg-background text-foreground",
          "min-h-screen flex flex-col"
        )}
        suppressHydrationWarning
      >
        <ProgressBar />
        <UserProvider>
          <Providers>
            <Suspense fallback={
              <div className="h-16 flex items-center justify-center bg-gradient-to-r from-[#0A2472] to-[#1e3a8a]">
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              </div>
            }>
              <Header />
            </Suspense>
            <GlobalLoadingWrapper>
              <div className="relative flex min-h-screen flex-col">
                {children}
              </div>
            </GlobalLoadingWrapper>
          </Providers>
        </UserProvider>
      </body>
    </html>
  );
}