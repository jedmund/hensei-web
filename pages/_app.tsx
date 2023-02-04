import { appWithTranslation } from 'next-i18next'
import { get } from 'local-storage'
import { getCookie, setCookie } from 'cookies-next'
import { subscribe } from 'valtio'
import { useEffect, useState } from 'react'
import { ThemeProvider } from 'next-themes'

import { accountState } from '~utils/accountState'
import { retrieveCookies } from '~utils/retrieveCookies'
import { setHeaders } from '~utils/userToken'

import { ToastProvider, Viewport } from '@radix-ui/react-toast'
import { TooltipProvider } from '@radix-ui/react-tooltip'

import Layout from '~components/Layout'

import type { AppProps } from 'next/app'

import '../styles/globals.scss'

function MyApp({ Component, pageProps }: AppProps) {
  const [refresh, setRefresh] = useState(false)

  // Subscribe to app state to listen for account changes and
  // unsubscribe when component is unmounted
  const unsubscribe = subscribe(accountState, () => {
    setRefresh(true)
  })

  useEffect(() => () => unsubscribe(), [])

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

  return (
    <ThemeProvider>
      <ToastProvider swipeDirection="right">
        <TooltipProvider>
          <Layout>
            <Component {...pageProps} />
          </Layout>
          <Viewport className="ToastViewport" />
        </TooltipProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default appWithTranslation(MyApp)
