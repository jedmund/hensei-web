import React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'

import './index.scss'

interface Props
  extends React.DetailedHTMLProps<
    React.DialogHTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  > {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const Dialog = React.forwardRef<HTMLDivElement, Props>(function dialog(
  { children, ...props },
  forwardedRef
) {
  const [locked, setLocked] = useLockedBody(false, 'root')

  }

  function onOpenChange(open: boolean) {
    props.onOpenChange(open)
  }

  return (
    <DialogPrimitive.Root open={props.open} onOpenChange={onOpenChange}>
      {children}
    </DialogPrimitive.Root>
  )
})

export const DialogTitle = DialogPrimitive.Title
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close
