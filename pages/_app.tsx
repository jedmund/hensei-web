import '../styles/globals.scss'

import { useState } from 'react'
import { CookiesProvider } from 'react-cookie'

import Layout from '~components/Layout'
import AppContext from '~context/AppContext'

import type { AppProps } from 'next/app'

function MyApp({ Component, pageProps }: AppProps) {
    const [authenticated, setAuthenticated] = useState(false)
    const [editable, setEditable] = useState(false)

    return (
        <CookiesProvider>
            <AppContext.Provider value={{ authenticated, setAuthenticated, editable, setEditable }}>
                <Layout>
                    <Component {...pageProps} />
                </Layout>
            </AppContext.Provider>
        </CookiesProvider>
    )
}

export default MyApp
