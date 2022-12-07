import { useEffect } from 'react'
import { getCookie } from 'cookies-next'
import { appWithTranslation } from 'next-i18next'
import { ThemeProvider } from 'next-themes'

import type { AppProps } from 'next/app'
import Layout from '~components/Layout'

import { accountState } from '~utils/accountState'

import '../styles/globals.scss'

function MyApp({ Component, pageProps }: AppProps) {
  const cookie = getCookie('account')
  const cookieData: AccountCookie = cookie ? JSON.parse(cookie as string) : null

  useEffect(() => {
    if (cookie) {
      console.log(`Logged in as user "${cookieData.username}"`)

      accountState.account.authorized = true
      accountState.account.user = {
        id: cookieData.userId,
        username: cookieData.username,
        picture: '',
        element: '',
        gender: 0,
      }
    } else {
      console.log(`You are not currently logged in.`)
    }
  }, [cookie, cookieData])

  return (
    <ThemeProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </ThemeProvider>
  )
}

export default appWithTranslation(MyApp)
