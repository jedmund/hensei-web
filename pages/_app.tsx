import { appWithTranslation } from 'next-i18next'
import Link from 'next/link'
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
import '../styles/globals.scss'

function MyApp({ Component, pageProps }: AppProps) {
  const { t } = useTranslation('common')
  const [refresh, setRefresh] = useState(false)

  // Subscribe to app state to listen for account changes and
  // unsubscribe when component is unmounted
  const unsubscribe = subscribe(accountState, () => {
    setRefresh(true)
  })

  useEffect(() => () => unsubscribe(), [])

  useEffect(() => {
    console.log('granblue.team version:')
    console.log(appState.version)
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
        granblueId: '',
        avatar: {
          picture: cookieData.user.avatar.picture,
          element: cookieData.user.avatar.element,
        },
        gender: cookieData.user.gender,
        language: cookieData.user.language,
        theme: cookieData.user.theme,
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
              <Link href="https://discord.gg/qyZ5hGdPC8">
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
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ThemeProvider>
      <ToastProvider swipeDirection="right">
        <TooltipProvider>
          <Layout>
            <Component {...pageProps} />
            {/* {!appState.version ? (
              serverUnavailable()
            ) : (
            )} */}
          </Layout>
          <Viewport className="ToastViewport" />
        </TooltipProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default appWithTranslation(MyApp)
