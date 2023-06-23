import React, { useEffect, useState } from 'react'
import classNames from 'classnames'

import styles from './index.module.scss'

interface Props
  extends React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > {
  visible?: boolean
  error?: string
  label?: string
}

const defaultProps = {
  visible: true,
}

const LabelledInput = React.forwardRef<HTMLInputElement, Props>(function Input(
  props: Props,
  forwardedRef
) {
  // States
  const [inputValue, setInputValue] = useState('')

  // Classes
  const classes = classNames({ Input: true }, props.className)
  const { defaultValue, visible, ...inputProps } = props

  // Change value when prop updates
  useEffect(() => {
    if (props.value) setInputValue(`${props.value}`)
  }, [props.value])

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(event.target.value)
    if (props.onChange) props.onChange(event)
  }

  return (
    <label
      className={classNames({
        Label: true,
        Visible: props.visible,
      })}
      htmlFor={props.name}
    >
      <input
        {...inputProps}
        autoComplete="off"
        className={classes}
        value={inputValue}
        ref={forwardedRef}
        onChange={handleChange}
        formNoValidate
      />
      {props.label}
      {props.error && props.error.length > 0 && (
        <p className="InputError">{props.error}</p>
      )}
    </label>
  )
})

LabelledInput.defaultProps = defaultProps

export default LabelledInput
