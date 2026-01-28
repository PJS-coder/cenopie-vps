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
  title: 'Cenopie - Professional Network',
  description: 'Connect with professionals and grow your career on Cenopie. Find jobs, network with industry experts, and showcase your skills.',
  keywords: ['professional network', 'career', 'jobs', 'networking', 'professionals', 'cenopie'],
  authors: [{ name: 'Cenopie Team' }],
  creator: 'Cenopie',
  publisher: 'Cenopie',
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
    title: 'Cenopie - Professional Network',
    description: 'Connect with professionals and grow your career on Cenopie. Find jobs, network with industry experts, and showcase your skills.',
    url: 'https://cenopie.com',
    siteName: 'Cenopie',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'Cenopie - Professional Network',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cenopie - Professional Network',
    description: 'Connect with professionals and grow your career on Cenopie. Find jobs, network with industry experts, and showcase your skills.',
    images: ['/og-image.svg'],
    creator: '@cenopie',
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
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' }
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/favicon.svg', type: 'image/svg+xml' }
    ],
  },
  manifest: '/manifest.json',
  verification: {
    google: 'your-google-verification-code', // Replace with actual verification code
  },
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