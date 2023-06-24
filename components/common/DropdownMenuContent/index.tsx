import React, { PropsWithChildren } from 'react'
import classNames from 'classnames'

import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'

import styles from './index.module.scss'

interface Props extends DropdownMenuPrimitive.DropdownMenuContentProps {}

export const DropdownMenu = DropdownMenuPrimitive.Root
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger
export const DropdownMenuSeparator = DropdownMenuPrimitive.Separator

export const DropdownMenuContent = React.forwardRef<HTMLDivElement, Props>(
  function dropdownMenuContent(
    { children, ...props }: PropsWithChildren<Props>,
    forwardedRef
  ) {
    const classes = classNames(props.className, {
      [styles.menu]: true,
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
