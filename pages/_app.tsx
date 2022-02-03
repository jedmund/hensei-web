import '../styles/globals.scss'

import { useState } from 'react'
import { CookiesProvider } from 'react-cookie'

import Layout from '~components/Layout'
import AppContext from '~context/AppContext'
import PartyContext from '~context/PartyContext'

import type { AppProps } from 'next/app'
import { TeamElement } from '~utils/enums'

function MyApp({ Component, pageProps }: AppProps) {
    const [authenticated, setAuthenticated] = useState(false)
    const [editable, setEditable] = useState(false)
    const [element, setElement] = useState<TeamElement>(TeamElement.Any)

    return (
        <CookiesProvider>
            <AppContext.Provider value={{ authenticated, setAuthenticated, editable, setEditable }}>
                <PartyContext.Provider value={{ element, setElement }}>
                    <Layout>
                        <Component {...pageProps} />
                    </Layout>
                </PartyContext.Provider>
            </AppContext.Provider>
        </CookiesProvider>
    )
}

export default MyApp
