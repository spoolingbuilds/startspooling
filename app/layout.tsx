import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import OfflineBanner from '@/components/OfflineBanner'
import { Polish } from '@/components/Polish'
import WebVitalsTracker from '@/components/WebVitalsTracker'

// Optimize fonts with next/font
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'StartSpooling | Remember Everything',
  description: 'Every build thread you\'ve lost. Every part number you forgot. Every progress photo scattered across platforms. We remember everything. Join the waitlist.',
  keywords: 'performance cars, build documentation, car builds, project cars, automotive community, turbo, boost, garage',
  authors: [{ name: 'StartSpooling' }],
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://startspooling.com',
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'StartSpooling - Your Builds, Documented',
    description: 'For the 2AM garage breakthroughs. For the builds nobody sees. Documentation that actually works.',
    type: 'website',
    url: 'https://startspooling.com',
    siteName: 'StartSpooling',
    locale: 'en_US',
    images: [
      {
        url: 'https://startspooling.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'StartSpooling - Your Builds, Documented',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StartSpooling - Your Builds, Documented',
    description: 'For the 2AM garage breakthroughs. For the builds nobody sees. Documentation that actually works.',
    images: ['https://startspooling.com/og-image.png'],
    creator: '@startspooling',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'StartSpooling',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  colorScheme: 'dark',
  themeColor: '#000000',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Prefetch external domains */}
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        
        {/* Preconnect to critical domains */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-Q4DPF21RBC"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-Q4DPF21RBC');
            `,
          }}
        />
        
        {/* ASCII Art Easter Egg for Homepage */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              /*
              ╔══════════════════════════════════════════════════════════════════════════════════════╗
              ║                                                                                      ║
              ║  ███████╗████████╗ █████╗ ██████╗ ███████╗██████╗ ██╗   ██╗                         ║
              ║  ██╔════╝╚══██╔══╝██╔══██╗██╔══██╗██╔════╝██╔══██╗██║   ██║                         ║
              ║  ███████╗   ██║   ███████║██████╔╝███████╗██████╔╝██║   ██║                         ║
              ║  ╚════██║   ██║   ██╔══██║██╔═══╝ ╚════██║██╔═══╝ ██║   ██║                         ║
              ║  ███████║   ██║   ██║  ██║██║     ███████║██║     ╚██████╔╝                         ║
              ║  ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝     ╚══════╝╚═╝      ╚═════╝                          ║
              ║                                                                                      ║
              ║  ┌─────────────────────────────────────────────────────────────────────────────┐  ║
              ║  │  welcome to the beginning.                                                 │  ║
              ║  │                                                                             │  ║
              ║  │  every build thread you've lost.                                           │  ║
              ║  │  every part number you forgot.                                             │  ║
              ║  │  every 2am breakthrough that nobody saw.                                   │  ║
              ║  │                                                                             │  ║
              ║  │  we remember everything.                                                    │  ║
              ║  │                                                                             │  ║
              ║  │  if you're reading this source...                                          │  ║
              ║  │  if you see what we're really building...                                  │  ║
              ║  │                                                                             │  ║
              ║  │  team@startspooling.com                                                   │  ║
              ║  │  tell us what you see.                                                      │  ║
              ║  └─────────────────────────────────────────────────────────────────────────────┘  ║
              ║                                                                                      ║
              ╚══════════════════════════════════════════════════════════════════════════════════════╝
              */
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} min-h-screen bg-black text-white antialiased font-sans`}>
        <OfflineBanner />
        <Polish />
        <WebVitalsTracker />
        {children}
      </body>
    </html>
  )
}
