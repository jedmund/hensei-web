import React from 'react'
import * as Select from '@radix-ui/react-select'

import './index.scss'
import classNames from 'classnames'

const SelectItem = React.forwardRef<HTMLDivElement>(
  ({ children, className, ...props }, forwardedRef) => {
    return (
      <Select.Item
        className={classNames('SelectItem', className)}
        {...props}
        ref={forwardedRef}
      >
        <Select.ItemText>{children}</Select.ItemText>
      </Select.Item>
    )
  }
)

export default SelectItem
