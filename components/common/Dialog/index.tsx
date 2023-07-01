import React, { PropsWithChildren, useEffect, useState } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { useLockedBody } from 'usehooks-ts'

interface Props extends DialogPrimitive.DialogProps {}

export const Dialog = ({ children, ...props }: PropsWithChildren<Props>) => {
  const [locked, setLocked] = useLockedBody(false, 'root')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (props.open != undefined) {
      toggleLocked(props.open)
      setOpen(props.open)
    }
  }, [props.open])

  function toggleLocked(open: boolean) {
    setLocked(open)
  }

  function handleOpenChange(open: boolean) {
    if (props.onOpenChange) props.onOpenChange(open)
    if (props.open === undefined) {
      toggleLocked(open)
    }
  }

  return (
    <DialogPrimitive.Root open={props.open} onOpenChange={handleOpenChange}>
      {children}
    </DialogPrimitive.Root>
  )
}

export const DialogTitle = DialogPrimitive.Title
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close
