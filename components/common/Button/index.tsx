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
  bound?: boolean
  floating?: boolean
  size?: 'icon' | 'small' | 'medium' | 'large'
  text?: string
}

const defaultProps = {
  active: false,
  blended: false,
  bound: false,
  floating: false,
  size: 'medium' as const,
}

const Button = React.forwardRef<HTMLButtonElement, Props>(function button(
  {
    leftAccessoryIcon,
    leftAccessoryClassName,
    rightAccessoryIcon,
    rightAccessoryClassName,
    active,
    blended,
    floating,
    bound,
    size,
    text,
    ...props
  },
  forwardedRef
) {
  const classes = classNames(
    {
      [styles.button]: true,
      [styles.active]: active,
      [styles.bound]: bound,
      [styles.blended]: blended,
      [styles.floating]: floating,
      [styles.icon]: size === 'icon',
      [styles.small]: size === 'small',
      [styles.medium]: size === 'medium' || !size,
      [styles.large]: size === 'large',
    },
    props.className?.split(' ').map((className) => styles[className])
  )

  const leftAccessoryClasses = classNames(
    {
      [styles.accessory]: true,
      [styles.left]: true,
    },
    leftAccessoryClassName?.split(' ').map((className) => styles[className])
  )

  const rightAccessoryClasses = classNames(
    {
      [styles.accessory]: true,
      [styles.right]: true,
    },
    rightAccessoryClassName?.split(' ').map((className) => styles[className])
  )

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
