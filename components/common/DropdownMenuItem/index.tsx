import React, { PropsWithChildren } from 'react'
import classNames from 'classnames'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import styles from './index.module.scss'

interface Props extends DropdownMenuPrimitive.DropdownMenuItemProps {}

export const DropdownMenuItem = React.forwardRef<HTMLDivElement, Props>(
  function dropdownMenuItem(
    { children, ...props }: PropsWithChildren<Props>,
    forwardedRef
  ) {
    const classes = classNames(props.className, {
      [styles.menuItem]: true,
      [styles.language]: props.className?.includes('language'),
    })

    return (
      <DropdownMenuPrimitive.Item
        {...props}
        className={classes}
        ref={forwardedRef}
      >
        {children}
      </DropdownMenuPrimitive.Item>
    )
  }
)

export default DropdownMenuItem
