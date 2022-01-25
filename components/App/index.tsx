import React from 'react'
import { Route, Routes, useNavigate } from 'react-router-dom'

import Header from '~components/Header'

import NewRoute from '~routes/NewRoute'
import PartyRoute from '~routes/PartyRoute'
import PartiesRoute from '~routes/PartiesRoute'
import ProfileRoute from '~routes/ProfileRoute'


const App = () => {
    const navigate = useNavigate()
    const route = (pathname: string) => navigate(pathname)

    return (   
        <div>
            <Header navigate={route} />
            <Routes>
                <Route path='/' element={<NewRoute />} />
                <Route path='/parties/' element={<PartiesRoute />} />
                <Route path='/p/:hash' element={<PartyRoute />} />
                <Route path='/:username' element={<ProfileRoute />} />
            </Routes>
        </div>
    )
}

export default App
