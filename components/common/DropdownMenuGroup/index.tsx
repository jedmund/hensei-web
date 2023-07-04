import React, { PropsWithChildren } from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import styles from './index.module.scss'

interface Props extends DropdownMenuPrimitive.DropdownMenuContentProps {}

export const DropdownMenuGroup = React.forwardRef<HTMLDivElement, Props>(
  function dropdownMenuGroup(
    { children }: PropsWithChildren<Props>,
    forwardedRef
  ) {
    return (
      <DropdownMenuPrimitive.Group
        className={styles.menuGroup}
        ref={forwardedRef}
      >
        {children}
      </DropdownMenuPrimitive.Group>
    )
  }
)

export default DropdownMenuGroup
