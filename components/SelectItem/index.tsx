import React, { ComponentProps } from 'react'
import * as Select from '@radix-ui/react-select'

import './index.scss'
import classNames from 'classnames'

interface Props extends ComponentProps<'div'> {
  value: string | number
  iconSrc?: string
  altText?: string
}

const SelectItem = React.forwardRef<HTMLDivElement, Props>(function selectItem(
  { children, ...props },
  forwardedRef
) {
  return (
    <Select.Item
      className={classNames('SelectItem', props.className)}
      {...props}
      ref={forwardedRef}
      value={`${props.value}`}
    >
      {props.iconSrc ? <img alt={props.altText} src={props.iconSrc} /> : ''}
      <Select.ItemText>{children}</Select.ItemText>
    </Select.Item>
  )
})

export default SelectItem
