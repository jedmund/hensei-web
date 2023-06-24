import React, { ComponentProps } from 'react'
import * as Select from '@radix-ui/react-select'

import styles from './index.module.scss'
import classNames from 'classnames'

interface Props extends ComponentProps<'div'> {
  value: string | number
  icon?: {
    src: string
    alt: string
  }
}

const SelectItem = React.forwardRef<HTMLDivElement, Props>(function selectItem(
  { icon, value, children, ...props },
  forwardedRef
) {
  return (
    <Select.Item
      {...props}
      className={classNames(
        {
          [styles.item]: true,
        },
        props.className
      )}
      ref={forwardedRef}
      value={`${value}`}
    >
      {icon ? <img alt={icon.alt} src={icon.src} /> : ''}
      <Select.ItemText>{children}</Select.ItemText>
    </Select.Item>
  )
})

export default SelectItem
