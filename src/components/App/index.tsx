import React from 'react'
import { Switch, Route, useHistory } from 'react-router-dom'
import './index.css'

import Header from '~components/Header'
import Main from '~components/Main'

import New from '~routes/New'
import Party from '~routes/Party'
import Parties from '~routes/Parties'
import Profile from '~routes/Profile'


const App = () => {
    const history = useHistory()
    const route = (pathname: string) => history.push(pathname)

    return (   
        <div>
            <Header navigate={route} />
            <Route exact path='/' component={New} />
            <Route exact path='/parties/' component={Parties} />
            <Route path='/p/:hash' component={Party} />
            <Route exact path='/:username' component={Profile} />
        </div>
    )
}

export default App
