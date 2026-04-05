/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Metadata, Viewport } from 'next';
import { Inter, Dancing_Script, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { cn } from '@/lib/utils';
import { ProgressBar } from '@/components/ProgressBar';

// Font optimization
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

// Viewport configuration
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

// Metadata for Vincollins Schools (Based on official website)
export const metadata: Metadata = {
  metadataBase: new URL('https://vincollinsschools.org'),
  title: {
    default: 'Vincollins Schools | Affordable Quality Education in Lagos',
    template: '%s | Vincollins Schools',
  },
  description: 'Vincollins Schools in Lagos offers Nursery (1-5 yrs), Primary (5-11 yrs), and College (11-17 yrs) education. Founded by Mrs. Joy Adaobi Nnoli to provide affordable, convenient, and excellent educational background for children.',
  keywords: [
    'Vincollins Schools',
    'schools in Lagos',
    'Lagos Nigeria schools',
    'Nursery school Lagos',
    'Primary school Lagos',
    'College Lagos',
    'Mrs. Joy Adaobi Nnoli',
    'affordable education Nigeria',
    'best schools in Lagos',
    'private schools Nigeria',
    'education Nigeria',
    'early years education',
    'primary education Lagos',
    'college education Nigeria'
  ],
  authors: [{ name: 'Mrs. Joy Adaobi Nnoli', url: 'https://vincollinsschools.org' }],
  creator: 'Vincollins Schools',
  publisher: 'Vincollins Schools',
  formatDetection: {
    email: true,
    address: true,
    telephone: true,
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
    description: 'Vincollins Schools offers Nursery (1-5 yrs), Primary (5-11 yrs), and College (11-17 yrs). Founded by financial analyst Mrs. Joy Adaobi Nnoli to impact the young generation.',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Vincollins Schools Campus - Lagos',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vincollins Schools | Lagos',
    description: 'Affordable, convenient, and excellent education for children 1-17 years in Lagos.',
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
    apple: [
      { url: '/images/icons/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: ['/favicon.png'],
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: 'https://vincollinsschools.org',
  },
  category: 'education',
  classification: 'Private Educational Institution',
};

// JSON-LD Structured Data (Updated with Proprietress info)
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  name: 'Vincollins Schools',
  alternateName: 'Vincollins',
  url: 'https://vincollinsschools.org',
  logo: 'https://vincollinsschools.org/images/logo.png',
  image: 'https://vincollinsschools.org/images/og-image.jpg',
  description: 'Vincollins Schools offers affordable, convenient, and excellent educational background for children in Lagos, helping them build a blueprint to succeed.',
  founder: {
    '@type': 'Person',
    name: 'Mrs. Joy Adaobi Nnoli',
    jobTitle: 'Proprietress',
    alumniOf: ['Enugu State University of Technology (MBA)', 'Nnamdi Azikiwe University (Economics)'],
    description: 'Accomplished financial/business analyst with decades of experience in the financial services sector. Established Vincollins Schools in 2019 to impact the young generation.',
  },
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Lagos',
    addressCountry: 'NG',
  },
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
          description: 'Early Years (1–5 Yrs). A curriculum full of activities, rhymes and real-life experiences that motivate children and provide a solid base for their future learning.',
          image: 'https://vincollinsschools.org/images/nursery.jpg',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'EducationalOccupationalProgram',
          name: 'Primary',
          educationalCredentialAwarded: 'Primary School Leaving Certificate',
          description: 'Primary Years (5–11 yrs). Programmes designed to provide pupils with fundamental skills in reading, writing, mathematics, and to establish a solid foundation for learning.',
          image: 'https://vincollinsschools.org/images/primary.jpg',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'EducationalOccupationalProgram',
          name: 'College',
          educationalCredentialAwarded: 'Secondary School Certificate',
          description: 'College Years (11–17 yrs). A challenging and balanced education which prepares students for adult responsibility in the modern world.',
          image: 'https://vincollinsschools.org/images/college.jpg',
        },
      },
    ],
  },
};

// Preload links - Fixed crossOrigin attribute
const preloadLinks = [
  { rel: 'preload', href: '/favicon.png', as: 'image', type: 'image/png' },
  { rel: 'preload', href: '/images/logo.png', as: 'image', type: 'image/png' },
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html 
      lang="en" 
      className={cn(
        inter.variable, 
        dancingScript.variable, 
        playfair.variable,
        "scroll-smooth"
      )}
      suppressHydrationWarning
    >
      <head>
        {/* Preload links - Fixed to handle crossOrigin properly */}
        <link rel="preload" href="/favicon.png" as="image" type="image/png" />
        <link rel="preload" href="/images/logo.png" as="image" type="image/png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        
        <meta name="color-scheme" content="light dark" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Vincollins Schools" />
        <meta name="msapplication-TileColor" content="#0A2472" />
        <meta name="theme-color" content="#0A2472" />
        
        {/* Fallback meta tags */}
        <meta property="og:image" content="/images/og-image.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:image" content="/images/twitter-image.jpg" />
      </head>
      <body 
        className={cn(
          "font-sans antialiased bg-background text-foreground",
          "min-h-screen flex flex-col"
        )}
        suppressHydrationWarning
      >
        <ProgressBar />
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}