import React, { PropsWithChildren } from 'react'
import classnames from 'classnames'
import * as PopoverPrimitive from '@radix-ui/react-popover'

import styles from './index.module.scss'

interface Props
  extends React.DetailedHTMLProps<
      React.DialogHTMLAttributes<HTMLDivElement>,
      HTMLDivElement
    >,
    PopoverPrimitive.PopoverContentProps {}

export const Popover = PopoverPrimitive.Root
export const PopoverAnchor = PopoverPrimitive.Anchor
export const PopoverTrigger = PopoverPrimitive.Trigger

export const PopoverContent = React.forwardRef<HTMLDivElement, Props>(
  function Popover(
    { children, ...props }: PropsWithChildren<Props>,
    forwardedRef
  ) {
    const classes = classnames(props.className, {
      Popover: true,
    })

    return (
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          {...props}
          className={classes}
          ref={forwardedRef}
        >
          {children}
          <PopoverPrimitive.Arrow className={styles.arrow} />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    )
  }
)

PopoverContent.defaultProps = {
  sideOffset: 8,
}
