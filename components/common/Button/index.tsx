import React from 'react'
import classNames from 'classnames'

import styles from './index.module.scss'

interface Props
  extends React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {
  leftAccessoryIcon?: React.ReactNode
  leftAccessoryClassName?: string
  rightAccessoryIcon?: React.ReactNode
  rightAccessoryClassName?: string
  active?: boolean
  blended?: boolean
  contained?: boolean
  buttonSize?: 'small' | 'medium' | 'large'
  text?: string
}

const defaultProps = {
  active: false,
  blended: false,
  contained: false,
  buttonSize: 'medium' as const,
}

const Button = React.forwardRef<HTMLButtonElement, Props>(function button(
  {
    leftAccessoryIcon,
    leftAccessoryClassName,
    rightAccessoryIcon,
    rightAccessoryClassName,
    active,
    blended,
    contained,
    buttonSize,
    text,
    ...props
  },
  forwardedRef
) {
  const classes = classNames(buttonSize, props.className, {
    Button: true,
    Active: active,
    Blended: blended,
    Contained: contained,
  })

  const leftAccessoryClasses = classNames(leftAccessoryClassName, {
    Accessory: true,
    Left: true,
  })

  const rightAccessoryClasses = classNames(rightAccessoryClassName, {
    Accessory: true,
    Right: true,
  })

  const hasLeftAccessory = () => {
    if (leftAccessoryIcon)
      return <span className={leftAccessoryClasses}>{leftAccessoryIcon}</span>
  }

  const hasRightAccessory = () => {
    if (rightAccessoryIcon)
      return <span className={rightAccessoryClasses}>{rightAccessoryIcon}</span>
  }

  const hasText = () => {
    if (text) return <span className="Text">{text}</span>
  }

  return (
    <button {...props} className={classes} ref={forwardedRef}>
      {hasLeftAccessory()}
      {hasText()}
      {hasRightAccessory()}
    </button>
  )
})

Button.defaultProps = defaultProps

export default Button
