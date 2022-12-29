import React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import classNames from 'classnames'

import './index.scss'
import Overlay from '~components/Overlay'

interface Props
  extends React.DetailedHTMLProps<
    React.DialogHTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  > {
  onEscapeKeyDown: (event: KeyboardEvent) => void
  onOpenAutoFocus: (event: Event) => void
}

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
        <DialogPrimitive.Content
          className={classes}
          {...props}
          onOpenAutoFocus={props.onOpenAutoFocus}
          onEscapeKeyDown={props.onEscapeKeyDown}
          ref={forwardedRef}
        >
          {children}
        </DialogPrimitive.Content>
        <Overlay visible={true} open={true} />
      </DialogPrimitive.Portal>
    )
  }
)

export const Dialog = DialogPrimitive.Root
export const DialogTitle = DialogPrimitive.Title
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close
