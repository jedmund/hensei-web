import { Metadata } from 'next'
import localFont from 'next/font/local'
import { ToastProvider, Viewport } from '@radix-ui/react-toast'
import { TooltipProvider } from '@radix-ui/react-tooltip'
import { ThemeProvider } from 'next-themes'

import '../styles/globals.scss'

// Components
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
        <ThemeProvider>
          <ToastProvider swipeDirection="right">
            <TooltipProvider>
              <Header />
              <UpdateToastClient />
              <main>{children}</main>
              <Viewport className="ToastViewport" />
            </TooltipProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}