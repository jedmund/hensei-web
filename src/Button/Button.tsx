import React from 'react'
import './Button.css'

import New from '../../assets/new.svg'
import Menu from '../../assets/menu.svg'
import Link from '../../assets/link.svg'

interface Props {
    type: string
}

class Button extends React.Component<Props> {
    static defaultProps: Props = {
        type: null
    }

    render() {
        let icon
        if (this.props.type === 'new') {
            icon = <span className='icon'><New /></span>
        } else if (this.props.type === 'menu') {
            icon = <span className='icon'><Menu /></span>
        } else if (this.props.type === 'link') {
            icon = <span className='icon'><Link /></span>
        }

        return <button className='Button'>
            {icon}
            <span className='text'>{this.props.children}</span>
        </button>
    }
}

export default Button