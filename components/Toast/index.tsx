import React, { PropsWithChildren } from 'react'
import classNames from 'classnames'

import * as ToastPrimitive from '@radix-ui/react-toast'
import './index.scss'

interface Props {
  className?: string
  title?: string
  content: string
}

const Toast = ({
  children,
  title,
  content,
  ...props
}: PropsWithChildren<Props>) => {
  const classes = classNames(props.className, {
    Toast: true,
  })

  return (
    <ToastPrimitive.Root {...props} className={classes}>
      {title && <ToastPrimitive.Title>{title}</ToastPrimitive.Title>}
      <ToastPrimitive.Description>{content}</ToastPrimitive.Description>
      {children && (
        <ToastPrimitive.Action asChild altText={content}>
          {children}
        </ToastPrimitive.Action>
      )}
      <ToastPrimitive.Close aria-label="Close">
        <span aria-hidden>×</span>
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  )
}

export default Toast
