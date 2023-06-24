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
    [styles.button]: true,
    [styles.active]: active,
    [styles.blended]: blended,
    [styles.contained]: contained,
    [styles.small]: buttonSize === 'small',
    [styles.medium]: buttonSize === 'medium',
    [styles.large]: buttonSize === 'large',
  })

  const leftAccessoryClasses = classNames(leftAccessoryClassName, {
    [styles.accessory]: true,
    [styles.left]: true,
  })

  const rightAccessoryClasses = classNames(rightAccessoryClassName, {
    [styles.accessory]: true,
    [styles.right]: true,
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
    if (text) return <span className={styles.text}>{text}</span>
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
