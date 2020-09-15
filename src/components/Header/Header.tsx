import React, { useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import './Header.css'

import Button from '../Button/Button'
import UnauthMenu from '../UnauthMenu/UnauthMenu'

class Header extends React.Component {
    constructor(props) {
        super(props)
        this.copyToClipboard = this.copyToClipboard.bind(this)
    }

    copyToClipboard() {
        const el = document.createElement('input')
        el.value = window.location.href
        el.id = 'url-input'
        document.body.appendChild(el)

        el.select()
        document.execCommand('copy')
        el.remove()
    }

    render() {
        return <nav className="Header">
            <div className="left">
                <div className="dropdown">
                    <Button type="menu">Menu</Button>
                    <UnauthMenu />
                </div>
            </div>
            <div className="push" />
            <div className="right">
                <Button type="link" click={this.copyToClipboard}>Copy link</Button>
                <Link to='/'>
                    <Button type="new">New</Button>
                </Link>
            </div>
        </nav>
    }
}

export default Header