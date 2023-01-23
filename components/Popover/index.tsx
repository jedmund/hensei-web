import React, { PropsWithChildren } from 'react'
import classnames from 'classnames'
import * as PopoverPrimitive from '@radix-ui/react-popover'

import './index.scss'

interface Props
  extends React.DetailedHTMLProps<
    React.DialogHTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  > {}

export const Popover = PopoverPrimitive.Root
export const PopoverAnchor = PopoverPrimitive.Anchor
export const PopoverTrigger = PopoverPrimitive.Trigger

export const PopoverContent = React.forwardRef<HTMLDivElement, Props>(
  ({ children, ...props }: PropsWithChildren<Props>, forwardedRef) => {
    const classes = classnames(props.className, {
      Popover: true,
    })

    return (
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          sideOffset={5}
          {...props}
          className={classes}
          ref={forwardedRef}
        >
          {children}
          <PopoverPrimitive.Arrow />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    )
  }
)
