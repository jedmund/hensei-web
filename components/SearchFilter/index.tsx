import React from 'react'

import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

import ArrowIcon from '~public/icons/Arrow.svg'
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
        {props.label}
        <span className="count">{props.numSelected}</span>
        <span className="icon">
          <ArrowIcon />
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
