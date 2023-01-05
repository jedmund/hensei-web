import React from 'react'
import classNames from 'classnames'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

import './index.scss'

interface Props
  extends React.DetailedHTMLProps<
    React.DialogHTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  > {
  align?: 'start' | 'center' | 'end'
}

export const ContextMenuContent = React.forwardRef<HTMLDivElement, Props>(
  function ContextMenu({ children, ...props }, forwardedRef) {
    const classes = classNames(
      {
        ContextMenu: true,
      },
      props.className
    )

    return (
      <DropdownMenu.Portal>
        <DropdownMenu.Content className={classes} {...props} ref={forwardedRef}>
          {children}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    )
  }
)

export const ContextMenu = DropdownMenu.Root
export const ContextMenuGroup = DropdownMenu.Group
export const ContextMenuTrigger = DropdownMenu.Trigger
