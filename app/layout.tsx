import { Metadata } from 'next'
import localFont from 'next/font/local'
import { Viewport } from '@radix-ui/react-toast'

import '../styles/globals.scss'

// Components
import Providers from './components/Providers'
import Header from './components/Header'
import UpdateToastClient from './components/UpdateToastClient'

// Metadata
export const metadata: Metadata = {
  title: 'granblue.team',
  description: 'Create, save, and share Granblue Fantasy party compositions',
  viewport: 'viewport-fit=cover, width=device-width, initial-scale=1.0',
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
          <Viewport className="ToastViewport" />
        </Providers>
      </body>
    </html>
  )
}