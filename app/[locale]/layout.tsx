import { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { Viewport as ToastViewport } from '@radix-ui/react-toast'
import { cookies } from 'next/headers'
import { locales } from '../../i18n.config'

import '../../styles/globals.scss'

// Components
import Providers from '../components/Providers'
import Header from '../components/Header'
import UpdateToastClient from '../components/UpdateToastClient'
import VersionHydrator from '../components/VersionHydrator'
import AccountStateInitializer from '~components/AccountStateInitializer'

// Generate static params for all locales
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

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
  src: '../../pages/fonts/gk-variable.woff2',
  fallback: ['system-ui', 'inter', 'helvetica neue', 'sans-serif'],
  variable: '--font-goalking',
})

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  // Load messages for the locale
  const messages = await getMessages()
  
  // Parse auth cookies on server
  const cookieStore = cookies()
  const accountCookie = cookieStore.get('account')
  const userCookie = cookieStore.get('user')
  
  let initialAuthData = null
  if (accountCookie && userCookie) {
    try {
      const accountData = JSON.parse(accountCookie.value)
      const userData = JSON.parse(userCookie.value)
      
      if (accountData && accountData.token) {
        initialAuthData = {
          account: accountData,
          user: userData
        }
      }
    } catch (error) {
      console.error('Error parsing auth cookies on server:', error)
    }
  }
  
  // Fetch version data on the server
  let version = null
  try {
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:1234'
    const res = await fetch(`${baseUrl}/api/version`, { 
      cache: 'no-store' 
    })
    if (res.ok) {
      version = await res.json()
    }
  } catch (error) {
    console.error('Failed to fetch version data:', error)
  }

  return (
    <html lang={locale} className={goalking.variable}>
      <body className={goalking.className}>
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <AccountStateInitializer initialAuthData={initialAuthData} />
            <Header />
            <VersionHydrator version={version} />
            <UpdateToastClient initialVersion={version} />
            <main>{children}</main>
            <ToastViewport className="ToastViewport" />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}