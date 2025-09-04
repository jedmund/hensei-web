import React, { PropsWithChildren } from 'react'
import classNames from 'classnames'

import * as ToastPrimitive from '@radix-ui/react-toast'
import styles from './index.module.scss'

interface Props extends Omit<ToastPrimitive.ToastProps, 'content'> {
  altText: string
  className?: string
  title?: string
  content: React.ReactNode
  onCloseClick: () => void
}

const Toast = ({
  altText,
  children,
  title,
  content,
  ...props
}: PropsWithChildren<Props>) => {
  const { onCloseClick, ...toastProps } = props

  const classes = classNames(props.className, {
    [styles.toast]: true,
  })

  return (
    <ToastPrimitive.Root {...toastProps} className={classes}>
      {title && (
        <div className={styles.header}>
          <ToastPrimitive.Title asChild>
            <h3>{title}</h3>
          </ToastPrimitive.Title>
          <ToastPrimitive.Close aria-label="Close" onClick={onCloseClick}>
            <span aria-hidden>×</span>
          </ToastPrimitive.Close>
        </div>
      )}
      <ToastPrimitive.Description asChild>
        <p>{content}</p>
      </ToastPrimitive.Description>
      {children && (
        <ToastPrimitive.Action asChild altText={altText}>
          {children}
        </ToastPrimitive.Action>
      )}
    </ToastPrimitive.Root>
  )
}

export default Toast
