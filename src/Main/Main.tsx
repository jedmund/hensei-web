import React from 'react'
import { Switch, Route } from 'react-router-dom'

import New from '../routes/New/New'
import Party from '../routes/Party/Party'
import Parties from '../routes/Parties/Parties'

// The Main component renders one of the three provided
// Routes (provided that one matches). Both the /roster
// and /schedule routes will match any pathname that starts
// with /roster or /schedule. The / route will only match
// when the pathname is exactly the string "/"
const Main = () => (
  <main>
    <Switch>
      <Route exact path='/' component={New} />
      <Route exact path='/parties/' component={Parties} />
      <Route path='/:hash' component={Party} />
    </Switch>
  </main>
)

export default Main
