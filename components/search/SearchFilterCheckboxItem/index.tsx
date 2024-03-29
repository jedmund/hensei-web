import React from 'react'

import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

import CheckIcon from '~public/icons/Check.svg'
import styles from './index.module.scss'

interface Props {
  checked?: boolean
  valueKey: string
  onCheckedChange: (open: boolean, key: string) => void
  children: React.ReactNode
}

const SearchFilterCheckboxItem = (props: Props) => {
  function handleCheckedChange(checked: string | boolean) {
    if (typeof checked === 'boolean') {
      props.onCheckedChange(checked, props.valueKey)
    } else {
      props.onCheckedChange(false, props.valueKey)
    }
  }

  return (
    <DropdownMenu.CheckboxItem
      className={styles.item}
      checked={props.checked || false}
      onCheckedChange={handleCheckedChange}
      onSelect={(event) => event.preventDefault()}
    >
      <DropdownMenu.ItemIndicator className={styles.indicator}>
        <CheckIcon />
      </DropdownMenu.ItemIndicator>
      {props.children}
    </DropdownMenu.CheckboxItem>
  )
}

export default SearchFilterCheckboxItem
