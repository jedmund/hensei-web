import React from 'react'
import './Nav.css'

import Button from '../Button/Button'

class Header extends React.Component {
    render() {
        return <nav className="Header">
            <div className="left">
                <Button type="new">New</Button>
            </div>
            <div className="push" />
            <div className="right">
                <Button type="link">Copy link</Button>
                <Button type="menu">Menu</Button>
            </div>
        </nav>
    }
}

export default Header