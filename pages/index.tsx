import type { NextPage } from 'next'
import Head from 'next/head'
import styles from '../styles/Home.module.css'

import { CookiesProvider } from 'react-cookie'
import { BrowserRouter } from 'react-router-dom'

import App from '~/components/App'

const Home: NextPage = () => {
  if (typeof window === "undefined") 
    return null
    
  return (
    <BrowserRouter>
        <CookiesProvider>
            <App />
        </CookiesProvider>
    </BrowserRouter>
  )
}

export default Home
