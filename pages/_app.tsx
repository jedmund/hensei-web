import { useEffect } from 'react'
import { useCookies, CookiesProvider } from 'react-cookie'
import { appWithTranslation } from 'next-i18next'

import type { AppProps } from 'next/app'
import Layout from '~components/Layout'

import { accountState } from '~utils/accountState'

import '../styles/globals.scss'

function MyApp({ Component, pageProps }: AppProps) {
    const [cookies] = useCookies(['account'])

    useEffect(() => {
        if (cookies.account) {
            console.log(`Logged in as user "${cookies.account.username}"`)

            accountState.account.authorized = true
            accountState.account.language = cookies.account.language
            accountState.account.user = {
                id: cookies.account.user_id,
                username: cookies.account.username,
                picture: '',
                element: ''
            }
        } else {
            console.log(`You are not currently logged in.`)
        }
    }, [cookies.account])

    return (
        <CookiesProvider>
            <Layout>
                <Component {...pageProps} />
            </Layout>
        </CookiesProvider>
    )
}

export default appWithTranslation(MyApp)
