import React, { useContext, useEffect, useState } from 'react'
import { useCookies } from 'react-cookie'
import { useRouter } from 'next/router'
import clonedeep from 'lodash.clonedeep'

import AppContext from '~context/AppContext'
import { appState, initialAppState } from '~utils/appState'

import Header from '~components/Header'
import Button from '~components/Button'
import HeaderMenu from '~components/HeaderMenu'


const TopHeader = () => {
    const { editable, setEditable, authenticated, setAuthenticated } = useContext(AppContext)

    const [username, setUsername] = useState(undefined)
    const [cookies, _, removeCookie] = useCookies(['user'])

    const router = useRouter()

    useEffect(() => {
        if (cookies.user) {
            setAuthenticated(true)
            setUsername(cookies.user.username)
            console.log(`Logged in as user "${cookies.user.username}"`)
        } else {
            setAuthenticated(false)
            console.log('You are currently not logged in.')
        }
    }, [cookies, setUsername, setAuthenticated])

    function copyToClipboard() {
        const el = document.createElement('input')
        el.value = window.location.href
        el.id = 'url-input'
        document.body.appendChild(el)

        el.select()
        document.execCommand('copy')
        el.remove()
    }

    function newParty() {
        router.push('/')
    }

    function logout() {
        removeCookie('user')

        setAuthenticated(false)
        if (editable) setEditable(false)

        // TODO: How can we log out without navigating to root
        router.push('/')
        return false
    }

    const leftNav = () => {
        return (
            <div className="dropdown">
                <Button icon="menu">Menu</Button>
                { (username) ? 
                    <HeaderMenu authenticated={authenticated} username={username} logout={logout} /> :
                    <HeaderMenu authenticated={authenticated} />
                }
            </div>
        )
    }

    const rightNav = () => {
        return (
            <div>
                { (router.route === '/p/[party]') ? 
                    <Button icon="link" click={copyToClipboard}>Copy link</Button> : ''
                }
                <Button icon="new" click={newParty}>New</Button>
            </div>
        )
    }
        
            
    return (
        <Header 
            position="top"
            left={ leftNav() }
            right={ rightNav() }
        />
    )
}

export default TopHeader