import React, { PropsWithChildren } from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import classNames from 'classnames'

import styles from './index.module.scss'

interface Props extends DropdownMenuPrimitive.DropdownMenuContentProps {}

export const DropdownMenu = DropdownMenuPrimitive.Root
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger
export const DropdownMenuLabel = DropdownMenuPrimitive.Label
export const DropdownMenuItem = DropdownMenuPrimitive.Item
export const DropdownMenuGroup = DropdownMenuPrimitive.Group
export const DropdownMenuSeparator = DropdownMenuPrimitive.Separator

export const DropdownMenuContent = React.forwardRef<HTMLDivElement, Props>(
  function dropdownMenuContent(
    { children, ...props }: PropsWithChildren<Props>,
    forwardedRef
  ) {
    const classes = classNames(props.className, {
      Menu: true,
    })
    return (
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          {...props}
          className={classes}
          ref={forwardedRef}
        >
          {children}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    )
  }
)

DropdownMenuContent.defaultProps = {
  sideOffset: 4,
}
