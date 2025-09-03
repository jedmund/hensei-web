import { appWithTranslation } from 'next-i18next'
import Head from 'next/head'
import localFont from 'next/font/local'
import { useIsomorphicLayoutEffect } from 'react-use'
import { useTranslation } from 'next-i18next'
import { get } from 'local-storage'
import { getCookie, setCookie } from 'cookies-next'
import { subscribe } from 'valtio'
import { useEffect, useState } from 'react'
import { ThemeProvider } from 'next-themes'

import { appState } from '~utils/appState'
import { accountState } from '~utils/accountState'
import { retrieveCookies } from '~utils/retrieveCookies'
import { setHeaders } from '~utils/userToken'

import { ToastProvider, Viewport } from '@radix-ui/react-toast'
import { TooltipProvider } from '@radix-ui/react-tooltip'

import Layout from '~components/Layout'

import type { AppProps } from 'next/app'

import DiscordIcon from '~public/icons/discord.svg'
import ShareIcon from '~public/icons/Share.svg'

const goalking = localFont({
  src: './fonts/gk-variable.woff2',
  fallback: ['system-ui', 'inter', 'helvetica neue', 'sans-serif'],
  variable: '--font-goalking',
})
import '../styles/globals.scss'

function MyApp({ Component, pageProps }: AppProps) {
  const { t } = useTranslation('common')
  const [mounted, setMounted] = useState(false)
  const [refresh, setRefresh] = useState(false)

  useIsomorphicLayoutEffect(() => {
    document.body.style.setProperty('--font-family', goalking.style.fontFamily)
  }, [])

  // Subscribe to app state to listen for account changes and
  // unsubscribe when component is unmounted
  const unsubscribe = subscribe(accountState, () => {
    setRefresh(true)
  })

  useEffect(() => () => unsubscribe(), [])

  useEffect(() => {
    console.log(`granblue.team version: ${appState.version?.version}`)
  }, [])

  const accountCookie = getCookie('account')
  const userCookie = getCookie('user')

  const cookieData = {
    account: accountCookie ? JSON.parse(accountCookie as string) : undefined,
    user: userCookie ? JSON.parse(userCookie as string) : undefined,
  }

  useEffect(() => {
    setHeaders()
    if (cookieData.account && cookieData.account.token) {
      console.log(`Logged in as user "${cookieData.account.username}"`)
      accountState.account.authorized = true
      accountState.account.user = {
        id: cookieData.account.userId,
        username: cookieData.account.username,
        role: cookieData.account.role,
        granblueId: '',
        avatar: {
          picture: cookieData.user.avatar.picture,
          element: cookieData.user.avatar.element,
        },
        gender: cookieData.user.gender,
        language: cookieData.user.language,
        theme: cookieData.user.theme,
        bahamut: cookieData.user.bahamut,
      }
    } else {
      console.log(`You are not currently logged in.`)
      setCookieFromLocalStorage()
    }
  }, [])

  useEffect(() => {
    setCookieFromLocalStorage()
  }, [refresh])

  function setCookieFromLocalStorage() {
    const localUserId: string | null = get('userId')
    const cookies = retrieveCookies()
    if (
      localUserId &&
      (!cookies || (cookies && cookies.account && !cookies.account.token))
    ) {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 60)

      const cookieObj = {
        userId: localUserId,
        role: 1,
        username: undefined,
        token: undefined,
      }

      setCookie('account', cookieObj, {
        path: '/',
        expires: expiresAt,
      })
    }
  }

  const serverUnavailable = () => {
    return (
      <div className="ServerUnavailableWrapper">
        <div className="ServerUnavailable">
          <div className="Message">
            <h1>{t('errors.server_unavailable.title')}</h1>
            <p>{t('errors.server_unavailable.message')}</p>
          </div>
          <div className="Connect">
            <p>{t('errors.server_unavailable.discord')}</p>
            <div className="Discord LinkItem">
              <a
                href="https://discord.gg/qyZ5hGdPC8"
                target="_blank"
                rel="noreferrer"
              >
                <div className="Left">
                  <DiscordIcon />
                  <h3>granblue-tools</h3>
                </div>
                <ShareIcon className="ShareIcon" />
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="viewport-fit=cover, width=device-width, initial-scale=1.0"
        />
      </Head>
      <ThemeProvider>
        <ToastProvider swipeDirection="right">
          <TooltipProvider>
            <Layout>
              {!appState.version ? (
                serverUnavailable()
              ) : (
                <Component {...pageProps} />
              )}
            </Layout>
            <Viewport className="ToastViewport" />
          </TooltipProvider>
        </ToastProvider>
      </ThemeProvider>
    </>
  )
}

export default appWithTranslation(MyApp)
