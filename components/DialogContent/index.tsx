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

const DialogContent = React.forwardRef<HTMLDivElement, Props>(function dialog(
  { children, ...props },
  forwardedRef
) {
  const classes = classNames(props.className, {
    DialogContent: true,
  })

  return (
    <DialogPrimitive.Portal>
      <dialog className="Dialog">
        <DialogPrimitive.Content
          {...props}
          className={classes}
          onOpenAutoFocus={props.onOpenAutoFocus}
          onEscapeKeyDown={props.onEscapeKeyDown}
          ref={forwardedRef}
        >
          {children}
        </DialogPrimitive.Content>
      </dialog>
      <Overlay visible={true} open={true} />
    </DialogPrimitive.Portal>
  )
})

export default DialogContent
