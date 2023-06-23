import React, { ComponentProps } from 'react'
import * as Select from '@radix-ui/react-select'

import styles from './index.module.scss'
import classNames from 'classnames'

interface Props extends ComponentProps<'div'> {
  src: string[]
  element: string
  value: string
}

const PictureSelectItem = React.forwardRef<HTMLDivElement, Props>(
  function selectItem({ children, ...props }, forwardedRef) {
    return (
      <Select.Item
        className={classNames('SelectItem Picture', props.className)}
        {...props}
        ref={forwardedRef}
        value={`${props.value}`}
      >
        <div className={`preview ${props.element}`}>
          <img
            alt={`${props.value}`}
            src={props.src[0]}
            srcSet={props.src.join(', ')}
          />
        </div>
        <Select.ItemText>{children}</Select.ItemText>
      </Select.Item>
    )
  }
)

export default PictureSelectItem
