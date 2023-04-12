import React, { PropsWithChildren } from 'react'
import classNames from 'classnames'

import * as HoverCardPrimitive from '@radix-ui/react-hover-card'
import './index.scss'

interface Props extends HoverCardPrimitive.HoverCardContentProps {}

export const Hovercard = HoverCardPrimitive.Root
export const HovercardTrigger = HoverCardPrimitive.Trigger

export const HovercardContent = ({
  children,
  ...props
}: PropsWithChildren<Props>) => {
  const classes = classNames(props.className, {
    HovercardContent: true,
  })
  return (
    <HoverCardPrimitive.Portal>
      <HoverCardPrimitive.Content
        {...props}
        className={classes}
        sideOffset={4}
        collisionPadding={{ top: 16, left: 16, right: 16, bottom: 16 }}
      >
        {children}
      </HoverCardPrimitive.Content>
    </HoverCardPrimitive.Portal>
  )
}
