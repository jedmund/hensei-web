import '../styles/globals.scss'

import type { AppProps } from 'next/app'
import { CookiesProvider } from 'react-cookie'
import Layout from '~components/Layout'

function MyApp({ Component, pageProps }: AppProps) {
    return (
        <CookiesProvider>
            <Layout>
                <Component {...pageProps} />
            </Layout>
        </CookiesProvider>
    )
}

export default MyApp
