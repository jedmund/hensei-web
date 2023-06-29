import React, { ComponentProps } from 'react'
import * as Select from '@radix-ui/react-select'

import styles from './index.module.scss'
import classNames from 'classnames'

interface Props extends ComponentProps<'div'> {
  value: string | number
  element?: string
  icon?: {
    src: string[]
    alt: string
  }
}

const SelectItem = React.forwardRef<HTMLDivElement, Props>(function selectItem(
  { icon, value, children, ...props },
  forwardedRef
) {
  const itemClasses = classNames(
    {
      [styles.item]: true,
    },
    props.className?.split(' ').map((className) => styles[className])
  )

  const wrapperClasses = classNames(
    {
      [styles.preview]: true,
    },
    props.element && styles[props.element]
  )

  return (
    <Select.Item
      {...props}
      className={itemClasses}
      ref={forwardedRef}
      value={`${value}`}
    >
      {icon && (
        <div className={wrapperClasses}>
          <img alt={icon.alt} src={icon.src[0]} srcSet={icon.src.join(', ')} />
        </div>
      )}
      <Select.ItemText>{children}</Select.ItemText>
    </Select.Item>
  )
})

export default SelectItem
