import React, { PropsWithChildren } from 'react'
import classNames from 'classnames'

import * as ToastPrimitive from '@radix-ui/react-toast'
import './index.scss'

interface Props extends ToastPrimitive.ToastProps {
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
      <div className="Header">
        {title && (
          <ToastPrimitive.Title asChild>
            <h3>{title}</h3>
          </ToastPrimitive.Title>
        )}
        <ToastPrimitive.Close aria-label="Close">
          <span aria-hidden>×</span>
        </ToastPrimitive.Close>
      </div>
      <ToastPrimitive.Description asChild>
        <p>{content}</p>
      </ToastPrimitive.Description>
      {children && (
        <ToastPrimitive.Action asChild altText={content}>
          {children}
        </ToastPrimitive.Action>
      )}
    </ToastPrimitive.Root>
  )
}

export default Toast
