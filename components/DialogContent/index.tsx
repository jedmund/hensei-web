import React, { useEffect } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import classNames from 'classnames'

import { DialogClose, DialogTitle } from '~components/Dialog'
import Overlay from '~components/Overlay'

import CrossIcon from '~public/icons/Cross.svg'
import './index.scss'

interface Props
  extends React.DetailedHTMLProps<
    React.DialogHTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  > {
  header?: React.ReactNode
  title?: string
  onEscapeKeyDown: (event: KeyboardEvent) => void
  onOpenAutoFocus: (event: Event) => void
}

const DialogContent = React.forwardRef<HTMLDivElement, Props>(function dialog(
  { children, ...props },
  forwardedRef
) {
  // Classes
  const classes = classNames(props.className, {
    DialogContent: true,
  })

  // Refs
  const headerRef = React.createRef<HTMLDivElement>()
  const containerRef = React.createRef<HTMLDivElement>()

  // Elements
  const genericHeader = (
    <div className="DialogHeader" ref={headerRef}>
      <DialogTitle className="DialogTitle">
        {props.title ? props.title : ''}
      </DialogTitle>
      <DialogClose className="DialogClose" asChild>
        <span>
          <CrossIcon />
        </span>
      </DialogClose>
    </div>
  )

  // Handlers
  function handleScroll(event: React.UIEvent<HTMLDivElement, UIEvent>) {
    const headerElement = headerRef.current
    const scrollTop = event.currentTarget?.scrollTop
    const boxShadowBase = '0 2px 8px'
    const maxValue = 50

    if (headerElement && scrollTop >= 0) {
      const input = scrollTop > maxValue ? maxValue : scrollTop

      const boxShadowOpacity = mapRange(input, 0, maxValue, 0.0, 0.16)
      const borderOpacity = mapRange(input, 0, maxValue, 0.0, 0.24)
      console.log(
        `Scroll top: ${scrollTop}, interpolated opacity: ${boxShadowOpacity}`
      )

      headerElement.style.boxShadow = `${boxShadowBase} rgba(0, 0, 0, ${boxShadowOpacity})`
      headerElement.style.borderBottomColor = `rgba(0, 0, 0, ${borderOpacity})`
    }
  }

  function mapRange(
    value: number,
    low1: number,
    high1: number,
    low2: number,
    high2: number
  ) {
    return low2 + ((high2 - low2) * (value - low1)) / (high1 - low1)
  }

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
          {props.title ? genericHeader : ''}
          <div
            className="Scrollable"
            ref={containerRef}
            onScroll={handleScroll}
          >
            {children}
          </div>
        </DialogPrimitive.Content>
      </dialog>
      <Overlay visible={true} open={true} />
    </DialogPrimitive.Portal>
  )
})

export default DialogContent
