import React, { PropsWithChildren } from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import styles from './index.module.scss'

interface Props extends DropdownMenuPrimitive.DropdownMenuLabelProps {}

export const DropdownMenuLabel = React.forwardRef<HTMLDivElement, Props>(
  function dropdownMenuItem(
    { children, ...props }: PropsWithChildren<Props>,
    forwardedRef
  ) {
    return (
      <DropdownMenuPrimitive.Label
        {...props}
        className={styles.menuLabel}
        ref={forwardedRef}
      >
        {children}
      </DropdownMenuPrimitive.Label>
    )
  }
)

export default DropdownMenuLabel
