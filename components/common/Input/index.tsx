import React, { useEffect, useState } from 'react'
import classNames from 'classnames'

import styles from './index.module.scss'

interface Props
  extends React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > {
  bound?: boolean
  visible?: string
  error?: string
  label?: string
}

const defaultProps = {
  visible: 'true',
}

const Input = React.forwardRef<HTMLInputElement, Props>(function Input(
  { value, visible, bound, error, label, ...props }: Props,
  forwardedRef
) {
  // States
  const [inputValue, setInputValue] = useState('')

  // Classes
  const classes = classNames(
    {
      [styles.input]: true,
      [styles.bound]: bound,
    },
    props.className
  )
  const { defaultValue, ...inputProps } = props

  // Change value when prop updates
  useEffect(() => {
    if (value) setInputValue(`${value}`)
  }, [value])

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(event.target.value)
    if (props.onChange) props.onChange(event)
  }

  return (
    <React.Fragment>
      <input
        {...inputProps}
        autoComplete="off"
        className={classes}
        value={inputValue}
        ref={forwardedRef}
        onChange={handleChange}
        formNoValidate
      />
      {error && error.length > 0 && <p className="InputError">{error}</p>}
    </React.Fragment>
  )
})

Input.defaultProps = defaultProps

export default Input
