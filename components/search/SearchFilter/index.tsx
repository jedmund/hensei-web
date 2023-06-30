import React from 'react'
import classNames from 'classnames'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

import ChevronIcon from '~public/icons/Chevron.svg'
import styles from './index.module.scss'

interface Props {
  label: string
  open: boolean
  display: 'grid' | 'list'
  numSelected: number
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

const SearchFilter = (props: Props) => {
  const displayClasses = classNames({
    [styles.grid]: props.display === 'grid',
    [styles.list]: props.display === 'list',
  })

  return (
    <DropdownMenu.Root open={props.open} onOpenChange={props.onOpenChange}>
      <DropdownMenu.Trigger className={styles.pill}>
        <div className={styles.label}>
          <span className={styles.text}>{props.label}</span>
          <span className={styles.count}>{props.numSelected}</span>
        </div>
        <span className={styles.icon}>
          <ChevronIcon />
        </span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        className={styles.dropdown}
        sideOffset={4}
        collisionPadding={16}
      >
        <div className={displayClasses}>{props.children}</div>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  )
}

export default SearchFilter
