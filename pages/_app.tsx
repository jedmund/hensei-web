import { useEffect } from 'react'
import { getCookie, getCookies } from 'cookies-next'
import { appWithTranslation } from 'next-i18next'
import { ThemeProvider } from 'next-themes'

import type { AppProps } from 'next/app'
import Layout from '~components/Layout'

import { accountState } from '~utils/accountState'
import setUserToken from '~utils/setUserToken'

import '../styles/globals.scss'

function MyApp({ Component, pageProps }: AppProps) {
  const accountCookie = getCookie('account')
  const userCookie = getCookie('user')

  const cookieData = {
    account: accountCookie ? JSON.parse(accountCookie as string) : undefined,
    user: userCookie ? JSON.parse(userCookie as string) : undefined,
  }

  useEffect(() => {
    setUserToken()

    if (accountCookie) {
      console.log(`Logged in as user "${cookieData.user}"`)
      console.log(cookieData.account, cookieData.user)

      accountState.account.authorized = true
      accountState.account.user = {
        id: cookieData.account.userId,
        username: cookieData.account.username,
        picture: cookieData.user.picture,
        element: cookieData.user.element,
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
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </ThemeProvider>
  )
}

export default appWithTranslation(MyApp)
