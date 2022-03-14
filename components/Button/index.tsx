import React, { useEffect, useState } from 'react'
import classNames from 'classnames'

import Link from 'next/link'

import AddIcon from '~public/icons/Add.svg'
import CheckIcon from '~public/icons/LargeCheck.svg'
import CrossIcon from '~public/icons/Cross.svg'
import EditIcon from '~public/icons/Edit.svg'
import LinkIcon from '~public/icons/Link.svg'
import MenuIcon from '~public/icons/Menu.svg'
import SaveIcon from '~public/icons/Save.svg'
import SettingsIcon from '~public/icons/Settings.svg'

import './index.scss'

import { ButtonType } from '~utils/enums'

interface Props {
    active?: boolean
    disabled?: boolean
    classes?: string[],
    icon?: string
    type?: ButtonType
    children?: React.ReactNode
    onClick?: (event: React.MouseEvent<HTMLElement>) => void
}

const Button = (props: Props) => {
    // States
    const [active, setActive] = useState(false)
    const [disabled, setDisabled] = useState(false)
    const [pressed, setPressed] = useState(false)
    const [buttonType, setButtonType] = useState(ButtonType.Base)

    const classes = classNames({
        Button: true,
        'Active': active,
        'btn-pressed': pressed,
        'btn-disabled': disabled,
        'save': props.icon === 'save',
        'destructive': props.type == ButtonType.Destructive
    }, props.classes)

    useEffect(() => {
        if (props.active) setActive(props.active)
        if (props.disabled) setDisabled(props.disabled)
        if (props.type) setButtonType(props.type)
    }, [props.active, props.disabled, props.type])

    const addIcon = (
        <span className='icon'>
            <AddIcon />
        </span>
    )

    const menuIcon = (
        <span className='icon'>
            <MenuIcon />
        </span>
    )

    const linkIcon = (
        <span className='icon stroke'>
            <LinkIcon />
        </span>
    )

    const checkIcon = (
        <span className='icon check'>
            <CheckIcon />
        </span>
    )

    const crossIcon = (
        <span className='icon'>
            <CrossIcon />
        </span>
    )

    const editIcon = (
        <span className='icon'>
            <EditIcon />
        </span>
    )

    const saveIcon = (
        <span className='icon stroke'>
            <SaveIcon />
        </span>
    )

    const settingsIcon = (
        <span className='icon settings'>
            <SettingsIcon />
        </span>
    )

    function getIcon() {
        let icon: React.ReactNode
        
        switch(props.icon) {
            case 'new':      icon = addIcon; break
            case 'menu':     icon = menuIcon; break
            case 'link':     icon = linkIcon; break
            case 'check':    icon = checkIcon; break
            case 'cross':    icon = crossIcon; break
            case 'edit':     icon = editIcon; break
            case 'save':     icon = saveIcon; break
            case 'settings': icon = settingsIcon; break
        }

        return icon
    }

    function handleMouseDown() {
        setPressed(true)
    }

    function handleMouseUp() {
        setPressed(false)
    }
    return (
        <button 
            className={classes} 
            disabled={disabled} 
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onClick={props.onClick}>
                { getIcon() }

                { (props.type != ButtonType.IconOnly) ? 
                    <span className='text'>
                        { props.children }
                    </span> : '' 
                }
        </button>
    )  
}

export default Button