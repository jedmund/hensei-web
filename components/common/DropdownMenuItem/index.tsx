import React, { PropsWithChildren } from 'react'
import classNames from 'classnames'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import styles from './index.module.scss'

interface Props extends DropdownMenuPrimitive.DropdownMenuItemProps {
  destructive?: boolean
}

const defaultProps = {
  destructive: false,
}

export const DropdownMenuItem = React.forwardRef<HTMLDivElement, Props>(
  function dropdownMenuItem(
    { children, destructive, ...props }: PropsWithChildren<Props>,
    forwardedRef
  ) {
    const classes = classNames(props.className, {
      [styles.menuItem]: true,
      [styles.language]: props.className?.includes('language'),
      [styles.destructive]: destructive,
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

DropdownMenuItem.defaultProps = defaultProps

export default DropdownMenuItem
