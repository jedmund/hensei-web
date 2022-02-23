import '../styles/globals.scss'

import { useState } from 'react'
import { CookiesProvider } from 'react-cookie'

import Layout from '~components/Layout'

import type { AppProps } from 'next/app'

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
