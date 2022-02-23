import React from 'react'

import './index.scss'

interface Props {
    position: 'top' | 'bottom'
    left: JSX.Element,
    right: JSX.Element
}

const Header = (props: Props) => {        
    return (
        <nav className={`Header ${props.position}`}>
            <div id="left">{ props.left }</div>
            <div className="push" />
            <div id="right">{ props.right }</div>
        </nav>
    )
}

export default Header