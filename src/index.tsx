import React from 'react'
import ReactDOM from 'react-dom'
import { createBrowserHistory } from 'history'
import { CookiesProvider } from 'react-cookie'
import { BrowserRouter } from 'react-router-dom'

import App from '~components/App'

ReactDOM.render((
    <BrowserRouter>
        <CookiesProvider>
            <App />
        </CookiesProvider>
    </BrowserRouter>
), document.getElementById('root'))