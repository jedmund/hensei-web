import React from 'react'
import { Router, Route } from 'react-router-dom'

import history from '~utils/history'

import New from '~routes/New'
import Party from '~routes/Party'
import Parties from '~routes/Parties'
import Profile from '~routes/Profile'

// The Main component renders one of the three provided
// Routes (provided that one matches). Both the /roster
// and /schedule routes will match any pathname that starts
// with /roster or /schedule. The / route will only match
// when the pathname is exactly the string "/"
const Main = () => (
  <main>
    <Router history={history}>
      <Route exact path='/' component={New} />
      <Route exact path='/parties/' component={Parties} />
      <Route path='/p/:hash' component={Party} />
      <Route path='/:username' component={Profile} />
    </Router>
  </main>
)

export default Main
