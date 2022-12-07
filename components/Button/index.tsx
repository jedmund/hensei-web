import React from 'react'
import classNames from 'classnames'

import './index.scss'

interface Props
  extends React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {
  accessoryIcon?: React.ReactNode
  active?: boolean
  blended?: boolean
  contained?: boolean
  size: 'small' | 'medium' | 'large'
  text?: string
}

const defaultProps = {
  active: false,
  blended: false,
  contained: false,
  size: 'medium' as const,
}

const Button = React.forwardRef<HTMLButtonElement, Props>(function button(
  { accessoryIcon, active, blended, contained, size, text, ...props },
  forwardedRef
) {
  const classes = classNames(
    {
      Button: true,
      Active: active,
      Blended: blended,
      Contained: contained,
    },
    buttonSize,
    props.className
  )

  const hasAccessory = () => {
    if (accessoryIcon) return <span className="Accessory">{accessoryIcon}</span>
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
})

Button.defaultProps = defaultProps

export default Button
