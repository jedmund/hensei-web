import React, { useEffect, useState } from 'react'
import { RouteComponentProps, useLocation, withRouter } from 'react-router-dom'
import { useCookies } from 'react-cookie'

import Button from '~components/Button/Button'
import HeaderMenu from '~components/HeaderMenu/HeaderMenu'

import './Header.css'

interface Props {}
interface HeaderProps extends RouteComponentProps<Props> {}

const Header: React.FC<HeaderProps> = (props: HeaderProps) => {
    const [username, setUsername] = useState(undefined)
    const [cookies, setCookie, removeCookie] = useCookies(['user'])
    let location = useLocation()

    useEffect(() => {
        if (cookies.user) {
            setUsername(cookies.user.username)
        }
    }, [])

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
        if (props.history.location.pathname === '/') {
            window.history.replaceState(null, `Grid Tool`, `/`)
            props.history.go(0)
        } else {
            props.history.push('/')
        }
    }

    function route(pathname: string) {
        props.history.push(pathname)
    }

    function logout() {
        removeCookie('user')
        window.history.replaceState(null, `Grid Tool`, `/`)
        props.history.go(0)
    }

    if (cookies.user != null) {
        console.log(`Logged in as user "${cookies.user.username}"`)
    }
        
    return (
        <nav className="Header">
            <div className="left">
                <div className="dropdown">
                    <Button type="menu">Menu</Button>
                    <HeaderMenu username={username} navigate={route} logout={logout} />
                </div>
            </div>
            <div className="push" />
            <div className="right">
                { (location.pathname !== '/') ?
                    <Button type="link" click={copyToClipboard}>Copy link</Button> : ''
                }
                <Button type="new" click={newParty}>New</Button>
            </div>
        </nav>
    )
}

export default withRouter(Header)