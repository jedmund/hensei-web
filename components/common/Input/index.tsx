import React, { useEffect, useState } from 'react'
import classNames from 'classnames'

import styles from './index.module.scss'

interface Props extends React.ComponentProps<'input'> {
  bound?: boolean
  hide1Password?: boolean
  showCounter?: boolean
}

const defaultProps = {
  bound: false,
  hide1Password: true,
  showCounter: false,
}

const Input = React.forwardRef<HTMLInputElement, Props>(function input(
  { value, bound, showCounter, ...props }: Props,
  forwardedRef
) {
  // States
  const [currentCount, setCurrentCount] = useState(() =>
    props.maxLength ? props.maxLength - (`${value}` || '').length : 0
  )

  // Classes
  const wrapperClasses = classNames(
    {
      [styles.wrapper]: showCounter,
      [styles.input]: showCounter,
      [styles.bound]: showCounter && bound,
    },
    showCounter &&
      props.className?.split(' ').map((className) => styles[className])
  )

  const inputClasses = classNames(
    {
      [styles.input]: !showCounter,
      [styles.bound]: !showCounter && bound,
    },
    !showCounter &&
      props.className?.split(' ').map((className) => styles[className])
  )
  const { defaultValue, ...inputProps } = props

  // Hooks
  useEffect(() => {
    if (props.maxLength)
      setCurrentCount(props.maxLength - (`${value}` || '').length)
  }, [props.maxLength, value])

  // Event handlers
  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (props.onChange) props.onChange(event)
  }

  // Rendering
  return (
    <div className={wrapperClasses}>
      <input
        {...inputProps}
        data-1p-ignore={props.hide1Password}
        autoComplete={props.autoComplete}
        className={inputClasses}
        type={props.type}
        name={props.name}
        placeholder={props.placeholder}
        defaultValue={value || ''}
        onBlur={props.onBlur}
        onChange={handleChange}
        maxLength={props.maxLength}
        ref={forwardedRef}
        formNoValidate
      />
      <span className={styles.counter}>{currentCount}</span>
    </div>
  )
})

Input.defaultProps = defaultProps

export default Input
