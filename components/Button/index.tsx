import React, { PropsWithChildren, useEffect, useState } from 'react'
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
import { access } from 'fs'

interface Props
  extends React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {
  accessoryIcon?: React.ReactNode
  active?: boolean
  blended?: boolean
  contained?: boolean
  size?: 'small' | 'medium' | 'large'
  text?: string
}

const defaultProps = {
  active: false,
  blended: false,
  contained: false,
  size: 'medium',
}

const Button = React.forwardRef<HTMLButtonElement, Props>(
  (
    { accessoryIcon, active, blended, contained, size, text, ...props },
    forwardedRef
  ) => {
    const classes = classNames(
      {
        Button: true,
        Active: active,
        Blended: blended,
        Contained: contained,
        // 'btn-pressed': pressed,
        // 'btn-disabled': disabled,
        // save: props.icon === 'save',
        // destructive: props.type == ButtonType.Destructive,
      },
      size,
      props.className
    )

    const hasAccessory = () => {
      if (accessoryIcon)
        return <span className="Accessory">{accessoryIcon}</span>
    }

    const hasText = () => {
      if (text) return <span className="Text">{text}</span>
    }

    return (
      <button {...props} className={classes} ref={forwardedRef}>
        {hasAccessory()}
        {hasText()}
      </button>
    )

    // useEffect(() => {
    // if (props.type) setButtonType(props.type)
    // }, [props.type])

    // const addIcon = (
    //   <span className="icon">
    //     <AddIcon />
    //   </span>
    // )

    // const menuIcon = (
    //   <span className="icon">
    //     <MenuIcon />
    //   </span>
    // )

    // const linkIcon = (
    //   <span className="icon stroke">
    //     <LinkIcon />
    //   </span>
    // )

    // const checkIcon = (
    //   <span className="icon check">
    //     <CheckIcon />
    //   </span>
    // )

    // const crossIcon = (
    //   <span className="icon">
    //     <CrossIcon />
    //   </span>
    // )

    // const editIcon = (
    //   <span className="icon">
    //     <EditIcon />
    //   </span>
    // )

    // const saveIcon = (
    //   <span className="icon stroke">
    //     <SaveIcon />
    //   </span>
    // )

    // const settingsIcon = (
    //   <span className="icon settings">
    //     <SettingsIcon />
    //   </span>
    // )

    // function getIcon() {
    //   let icon: React.ReactNode

    //   switch (props.icon) {
    //     case 'new':
    //       icon = addIcon
    //       break
    //     case 'menu':
    //       icon = menuIcon
    //       break
    //     case 'link':
    //       icon = linkIcon
    //       break
    //     case 'check':
    //       icon = checkIcon
    //       break
    //     case 'cross':
    //       icon = crossIcon
    //       break
    //     case 'edit':
    //       icon = editIcon
    //       break
    //     case 'save':
    //       icon = saveIcon
    //       break
    //     case 'settings':
    //       icon = settingsIcon
    //       break
    //   }

    //   return icon
    // }

    // function handleMouseDown() {
    //   setPressed(true)
    // }

    // function handleMouseUp() {
    //   setPressed(false)
    // }
    // return (
    //   <button
    //     className={classes}
    //     disabled={disabled}
    //     onMouseDown={handleMouseDown}
    //     onMouseUp={handleMouseUp}
    //     ref={forwardedRef}
    //     {...props}
    //   >
    //     {getIcon()}

    //     {props.type != ButtonType.IconOnly ? (
    //       <span className="text">{children}</span>
    //     ) : (
    //       ''
    //     )}
    //   </button>
    // )
  }
)

Button.defaultProps = defaultProps

export default Button
