import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../styles/globals.css'
import Providers from '@/components/Providers'
import ConditionalNavbar from '@/components/ConditionalNavbar'
import ErrorBoundary from '@/components/ErrorBoundary'
import ConditionalFooter from '@/components/ConditionalFooter'
import GlobalLoadingIndicator from '@/components/GlobalLoadingIndicator'
import { ToastProvider } from '@/components/ToastProvider'
import ConditionalMain from '@/components/ConditionalMain'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Cenopie - Professional Network',
  description: 'Connect with professionals and grow your career',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.ico',
    apple: '/favicon.svg'
  },
  manifest: '/manifest.json',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <Providers>
            <ToastProvider>
              <GlobalLoadingIndicator />
              <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
                <ConditionalNavbar />
                <ConditionalMain>
                  {children}
                </ConditionalMain>
                <ConditionalFooter />
              </div>
            </ToastProvider>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  )
}