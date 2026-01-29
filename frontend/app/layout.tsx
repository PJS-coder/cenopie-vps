import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../styles/globals.css'
import Providers from '@/components/Providers'
import ConditionalNavbar from '@/components/ConditionalNavbar'
import ErrorBoundary from '@/components/ErrorBoundary'
import ConditionalFooter from '@/components/ConditionalFooter'
import ProgressLoader from '@/components/ProgressLoader'
import AppInitializer from '@/components/AppInitializer'
import PerformanceMonitor from '@/components/PerformanceMonitor'
import { ToastProvider } from '@/components/ToastProvider'
import ConditionalMain from '@/components/ConditionalMain'
import { Suspense } from 'react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Cenopie - Professional Network & Career Platform',
    template: '%s | Cenopie'
  },
  description: 'Join Cenopie, the professional network connecting talent with opportunities. Find jobs, showcase skills, network with professionals, and advance your career. Currently in Beta.',
  keywords: [
    'professional network', 'career platform', 'job search', 'networking', 
    'professionals', 'cenopie', 'beta', 'career development', 'job opportunities',
    'professional connections', 'skill showcase', 'career growth'
  ],
  authors: [{ name: 'Cenopie Team', url: 'https://cenopie.com' }],
  creator: 'Cenopie',
  publisher: 'Cenopie',
  applicationName: 'Cenopie',
  referrer: 'origin-when-cross-origin',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://cenopie.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Cenopie - Professional Network & Career Platform (Beta)',
    description: 'Join Cenopie, the professional network connecting talent with opportunities. Find jobs, showcase skills, network with professionals, and advance your career.',
    url: 'https://cenopie.com',
    siteName: 'Cenopie',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'Cenopie - Professional Network & Career Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cenopie - Professional Network & Career Platform (Beta)',
    description: 'Join Cenopie, the professional network connecting talent with opportunities. Find jobs, showcase skills, and advance your career.',
    images: ['/og-image.svg'],
    creator: '@cenopie',
    site: '@cenopie',
  },
  robots: {
    index: true,
    follow: true,
    noarchive: false,
    nosnippet: false,
    noimageindex: false,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' }
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/favicon.svg', type: 'image/svg+xml', sizes: 'any' },
      { url: '/logo.svg', sizes: '180x180', type: 'image/svg+xml' }
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/favicon.svg',
        color: '#0BC0DF',
      },
    ],
  },
  manifest: '/manifest.json',
  category: 'business',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Critical SEO Meta Tags */}
        <title>Cenopie - Professional Network & Career Platform (Beta)</title>
        <meta name="description" content="Join Cenopie, the professional network connecting talent with opportunities. Find jobs, showcase skills, network with professionals, and advance your career. Currently in Beta." />
        <meta property="og:title" content="Cenopie - Professional Network & Career Platform (Beta)" />
        <meta property="og:description" content="Join Cenopie, the professional network connecting talent with opportunities. Find jobs, showcase skills, network with professionals, and advance your career." />
        <meta property="og:image" content="https://cenopie.com/og-image.svg" />
        <meta property="og:url" content="https://cenopie.com" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Cenopie - Professional Network & Career Platform (Beta)" />
        <meta name="twitter:description" content="Join Cenopie, the professional network connecting talent with opportunities. Find jobs, showcase skills, and advance your career." />
        <meta name="twitter:image" content="https://cenopie.com/og-image.svg" />
        
        {/* Additional meta tags for better SEO and branding */}
        <meta name="application-name" content="Cenopie" />
        <meta name="apple-mobile-web-app-title" content="Cenopie" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#0BC0DF" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="theme-color" content="#0BC0DF" />
        
        {/* Permissions Policy for Camera and Microphone Access */}
        <meta httpEquiv="Permissions-Policy" content="camera=(self), microphone=(self), display-capture=(self)" />
        
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS prefetch for better performance */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        
        {/* Additional favicon formats */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        <link rel="mask-icon" href="/favicon.svg" color="#0BC0DF" />
        
        {/* Microsoft tiles */}
        <meta name="msapplication-TileImage" content="/favicon.svg" />
        <meta name="msapplication-square70x70logo" content="/favicon.svg" />
        <meta name="msapplication-square150x150logo" content="/favicon.svg" />
        <meta name="msapplication-wide310x150logo" content="/logo.svg" />
        <meta name="msapplication-square310x310logo" content="/favicon.svg" />
      </head>
      <body className={inter.className}>
        <PerformanceMonitor />
        <AppInitializer>
          <ErrorBoundary>
            <Providers>
              <ToastProvider>
                <ProgressLoader isLoading={false} />
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
                  <ConditionalNavbar />
                  <ConditionalMain>
                    <Suspense fallback={<ProgressLoader isLoading={true} />}>
                      {children}
                    </Suspense>
                  </ConditionalMain>
                  <ConditionalFooter />
                </div>
              </ToastProvider>
            </Providers>
          </ErrorBoundary>
        </AppInitializer>
      </body>
    </html>
  )
}