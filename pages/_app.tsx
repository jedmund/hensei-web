import { useEffect } from 'react'
import { useCookies, CookiesProvider } from 'react-cookie'

import type { AppProps } from 'next/app'
import Layout from '~components/Layout'

import { accountState } from '~utils/accountState'

import '../styles/globals.scss'

function MyApp({ Component, pageProps }: AppProps) {
    const [cookies] = useCookies(['user'])

    useEffect(() => {
        if (cookies.user) {
            console.log(`Logged in as user "${cookies.user.username}"`)

            accountState.account.authorized = true
            accountState.account.language = cookies.user.language
            accountState.account.user = {
                id: cookies.user.user_id,
                username: cookies.user.username,
                picture: cookies.user.picture,
                element: cookies.user.element
            }
        } else {
            console.log(`You are not currently logged in.`)
        }
    }, [cookies.user])

    return (
        <CookiesProvider>
            <Layout>
                <Component {...pageProps} />
            </Layout>
        </CookiesProvider>
    )
}

export default MyApp
