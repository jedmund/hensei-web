import { useEffect } from 'react'
import { getCookie } from 'cookies-next'
import { appWithTranslation } from 'next-i18next'
import { ThemeProvider } from 'next-themes'

import type { AppProps } from 'next/app'
import Layout from '~components/Layout'

import { accountState } from '~utils/accountState'
import { setHeaders } from '~utils/userToken'

import '../styles/globals.scss'
import { ToastProvider, Viewport } from '@radix-ui/react-toast'
import { TooltipProvider } from '@radix-ui/react-tooltip'

function MyApp({ Component, pageProps }: AppProps) {
  const accountCookie = getCookie('account')
  const userCookie = getCookie('user')

  const cookieData = {
    account: accountCookie ? JSON.parse(accountCookie as string) : undefined,
    user: userCookie ? JSON.parse(userCookie as string) : undefined,
  }

  useEffect(() => {

    if (accountCookie) {
    setHeaders()
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
    }
  }, [])

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
