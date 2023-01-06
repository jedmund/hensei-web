import React from 'react'
import classNames from 'classnames'
import { DropdownMenuItem } from '@radix-ui/react-dropdown-menu'

import './index.scss'

interface Props {
  className?: string
  onSelect?: (event: Event) => void
  children: React.ReactNode
}

const ContextMenuItem = React.forwardRef<HTMLDivElement, Props>(
  function ContextMenu({ children, ...props }, forwardedRef) {
    const classes = classNames(
      {
        ContextItem: true,
      },
      props.className
    )

    return (
      <DropdownMenuItem className={classes} onSelect={props.onSelect}>
        {children}
      </DropdownMenuItem>
    )
  }
)

export default ContextMenuItem
