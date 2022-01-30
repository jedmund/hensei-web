import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useCookies } from 'react-cookie'

import Button from '~components/Button'
import HeaderMenu from '~components/HeaderMenu'

import './index.scss'

interface Props {
    navigate: (pathname: string) => void
}

const Header = (props: Props) => {
    const [username, setUsername] = useState(undefined)
    const [cookies, setCookie, removeCookie] = useCookies(['user'])

    let navigate = useNavigate()
    let location = useLocation()
    
    const route = (pathname: string) => props.navigate(pathname)

    useEffect(() => {
        if (cookies.user) {
            setUsername(cookies.user.username)
            console.log(`Logged in as user "${cookies.user.username}"`)
        }
    }, [cookies])

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
        navigate('/')
    }

    function logout() {
        removeCookie('user')
        window.history.replaceState(null, `Grid Tool`, `/`)
        navigate(0)
    }
        
    return (
        <nav className="Header">
            <div className="left">
                <div className="dropdown">
                    <Button type="menu">Menu</Button>
                    <HeaderMenu username={username} logout={logout} />
                </div>
            </div>
            <div className="push" />
            <div className="right">
                {/* { (location.pathname.includes('/p/')) ?
                    <Button color="red" type="link" click={() => {}}>Delete</Button> : ''
                } */}
                { (location.pathname.includes('/p/')) ?
                    <Button type="link" click={copyToClipboard}>Copy link</Button> : ''
                }
                <Button type="new" click={newParty}>New</Button>
            </div>
        </nav>
    )
}

export default Header