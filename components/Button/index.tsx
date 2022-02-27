import React from 'react'
import classNames from 'classnames'

import Link from 'next/link'

import AddIcon from '~public/icons/Add.svg'
import CrossIcon from '~public/icons/Cross.svg'
import EditIcon from '~public/icons/Edit.svg'
import LinkIcon from '~public/icons/Link.svg'
import MenuIcon from '~public/icons/Menu.svg'

import './index.scss'

import { ButtonType } from '~utils/enums'

interface Props {
    active: boolean
    disabled: boolean
    icon: string | null
    type: ButtonType
    click: any
}

interface State {
    isPressed: boolean
}

class Button extends React.Component<Props, State> {
    static defaultProps: Props = {
        active: false,
        disabled: false,
        icon: null,
        type: ButtonType.Base,
        click: () => {}
    }

    constructor(props: Props) {
        super(props)
        this.state = {
            isPressed: false,
        }
    }

    render() {
        let icon
        if (this.props.icon === 'new') {
            icon = <span className='icon'>
                <AddIcon />
            </span>
        } else if (this.props.icon === 'menu') {
            icon = <span className='icon'>
                <MenuIcon />
            </span>
        } else if (this.props.icon === 'link') {
            icon = <span className='icon stroke'>
                <LinkIcon />
            </span>
        } else if (this.props.icon === 'cross') {
            icon = <span className='icon'>
                <CrossIcon />
            </span>
        } else if (this.props.icon === 'edit') {
            icon = <span className='icon'>
                <EditIcon />
            </span>
        }

        const classes = classNames({
            Button: true,
            'Active': this.props.active,
            'btn-pressed': this.state.isPressed,
            'btn-disabled': this.props.disabled,
            'destructive': this.props.type == ButtonType.Destructive
        })

        return <button className={classes} disabled={this.props.disabled} onClick={this.props.click}>
            {icon}
            <span className='text'>{this.props.children}</span>
        </button>
    }
}

export default Button