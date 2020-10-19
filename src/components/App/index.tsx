import React from 'react'
import { Route, useHistory } from 'react-router-dom'
import './index.css'

import Header from '~components/Header'

import NewRoute from '~routes/NewRoute'
import PartyRoute from '~routes/PartyRoute'
import PartiesRoute from '~routes/PartiesRoute'
import ProfileRoute from '~routes/ProfileRoute'


const App = () => {
    const history = useHistory()
    const route = (pathname: string) => history.push(pathname)

    return (   
        <div>
            <Header navigate={route} />
            <Route exact path='/' component={NewRoute} />
            <Route exact path='/parties/' component={PartiesRoute} />
            <Route path='/p/:hash' component={PartyRoute} />
            <Route exact path='/:username' component={ProfileRoute} />
        </div>
    )
}

export default App
