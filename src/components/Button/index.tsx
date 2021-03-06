import React from 'react'
import classNames from 'classnames'

import './index.scss'

import New from '../../../assets/new'
import Menu from '../../../assets/menu'
import Link from '../../../assets/link'

interface Props {
    color: string
    disabled: boolean
    type: string | null
    click: any
}

interface State {
    isPressed: boolean
}

class Button extends React.Component<Props, State> {
    static defaultProps: Props = {
        color: 'grey',
        disabled: false,
        type: null,
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
        if (this.props.type === 'new') {
            icon = <span className='icon'><New /></span>
        } else if (this.props.type === 'menu') {
            icon = <span className='icon'><Menu /></span>
        } else if (this.props.type === 'link') {
            icon = <span className='icon'><Link /></span>
        }

        const classes = classNames({
            Button: true,
            'btn-pressed': this.state.isPressed,
            'btn-disabled': this.props.disabled,
            [`btn-${this.props.color}`]: true
        })

        return <button className={classes} disabled={this.props.disabled} onClick={this.props.click}>
            {icon}
            <span className='text'>{this.props.children}</span>
        </button>
    }
}

export default Button