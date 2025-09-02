import { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { Viewport as ToastViewport } from '@radix-ui/react-toast'

import '../styles/globals.scss'

// Components
import Providers from './components/Providers'
import Header from './components/Header'
import UpdateToastClient from './components/UpdateToastClient'

// Metadata
export const metadata: Metadata = {
  title: 'granblue.team',
  description: 'Create, save, and share Granblue Fantasy party compositions',
}

// Viewport configuration (Next.js 13+ requires separate export)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

// Font
const goalking = localFont({
  src: '../pages/fonts/gk-variable.woff2',
  fallback: ['system-ui', 'inter', 'helvetica neue', 'sans-serif'],
  variable: '--font-goalking',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={goalking.variable}>
      <body className={goalking.className}>
        <Providers>
          <Header />
          <UpdateToastClient />
          <main>{children}</main>
          <ToastViewport className="ToastViewport" />
        </Providers>
      </body>
    </html>
  )
}