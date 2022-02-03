import React, { useContext, useEffect, useState } from 'react'
import { useCookies } from 'react-cookie'
import { useRouter } from 'next/router'

import AppContext from '~context/AppContext'

import Button from '~components/Button'
import HeaderMenu from '~components/HeaderMenu'

import './index.scss'

interface Props {}

const Header = (props: Props) => {
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

        // How can we log out without navigating to root
        router.push('/')
        return false
    }
        
    return (
        <nav id="Header">
            <div id="left">
                <div className="dropdown">
                    <Button type="menu">Menu</Button>
                    { (username) ? 
                        <HeaderMenu authenticated={authenticated} username={username} logout={logout} /> :
                        <HeaderMenu authenticated={authenticated} />
                    }
                </div>
            </div>
            <div className="push" />
            <div id="right">
                { (editable && router.route === '/p/[slug]') ?
                    <Button color="red" type="link" click={() => {}}>Delete</Button> : ''
                }
                { (router.route === '/p/[slug]') ? 
                    <Button type="link" click={copyToClipboard}>Copy link</Button> : ''
                }
                <Button type="new" click={newParty}>New</Button>
            </div>
        </nav>
    )
}

export default Header