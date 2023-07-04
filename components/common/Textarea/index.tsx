import React, { useState } from 'react'
import classNames from 'classnames'
import styles from './index.module.scss'

interface Props extends React.ComponentProps<'div'> {
  bound?: boolean
  placeholder?: string
  value?: string
}

const Textarea = React.forwardRef<HTMLDivElement, Props>(function Textarea(
  { bound, value: initialValue, ...props }: Props,
  forwardedRef
) {
  // State
  const [value, setValue] = useState(initialValue || '')

  // Classes
  const classes = classNames(
    {
      [styles.textarea]: true,
      [styles.bound]: bound,
    },
    props.className?.split(' ').map((className) => styles[className])
  )
  // Methods: Rendering
  return (
    <div
      {...props}
      contentEditable={true}
      suppressContentEditableWarning={true}
      className={classes}
      ref={forwardedRef}
    >
      {value}
    </div>
  )
})

export default Textarea
