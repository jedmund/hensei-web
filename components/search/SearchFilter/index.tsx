import React from 'react'

import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

import ChevronIcon from '~public/icons/Chevron.svg'
import './index.scss'

interface Props {
  label: string
  open: boolean
  numSelected: number
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

const SearchFilter = (props: Props) => {
  return (
    <DropdownMenu.Root open={props.open} onOpenChange={props.onOpenChange}>
      <DropdownMenu.Trigger className="DropdownLabel">
        <div>
          {props.label}
          <span className="count">{props.numSelected}</span>
        </div>
        <span className="icon">
          <ChevronIcon />
        </span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content className="Dropdown" sideOffset={4}>
        {props.children}
        <DropdownMenu.Arrow />
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  )
}

export default SearchFilter
