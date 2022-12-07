import React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import classNames from 'classnames'

import './index.scss'

interface Props
  extends React.DetailedHTMLProps<
    React.DialogHTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  > {}

export const DialogContent = React.forwardRef<HTMLDivElement, Props>(
  function dialog({ children, ...props }, forwardedRef) {
    const classes = classNames(
      {
        Dialog: true,
      },
      props.className
    )

    return (
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="Overlay" />
        <DialogPrimitive.Content
          className={classes}
          {...props}
          ref={forwardedRef}
        >
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    )
  }
)

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close
