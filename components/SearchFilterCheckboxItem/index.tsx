import React from 'react'

import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

import CheckIcon from '~public/icons/Check.svg'
import './index.scss'

interface Props {
  checked?: boolean
  valueKey: string
  onCheckedChange: (open: boolean, key: string) => void
  children: React.ReactNode
}

const SearchFilterCheckboxItem = (props: Props) => {
  function handleCheckedChange(checked: boolean) {
    props.onCheckedChange(checked, props.valueKey)
  }

  return (
    <DropdownMenu.CheckboxItem
      className="Item"
      checked={props.checked || false}
      onCheckedChange={handleCheckedChange}
      onSelect={(event) => event.preventDefault()}
    >
      <DropdownMenu.ItemIndicator className="Indicator">
        <CheckIcon />
      </DropdownMenu.ItemIndicator>
      {props.children}
    </DropdownMenu.CheckboxItem>
  )
}

export default SearchFilterCheckboxItem
