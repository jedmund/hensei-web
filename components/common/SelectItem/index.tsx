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
  { children, value, ...props },
  forwardedRef
) {
  const { altText, iconSrc, ...rest } = props
  return (
    <Select.Item
      className={classNames('SelectItem', props.className)}
      {...rest}
      ref={forwardedRef}
      value={`${value}`}
    >
      {iconSrc ? <img alt={altText} src={iconSrc} /> : ''}
      <Select.ItemText>{children}</Select.ItemText>
    </Select.Item>
  )
})

export default SelectItem
