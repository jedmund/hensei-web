import classNames from 'classnames'
import React from 'react'
import './index.scss'

interface Props
  extends React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > {
  error?: string
  label?: string
}

const Input = React.forwardRef<HTMLInputElement, Props>(function input(
  props: Props,
  forwardedRef
) {
  const classes = classNames({ Input: true }, props.className)
  const { value, ...inputProps } = props

  return (
    <label className="Label" htmlFor={props.name}>
      <input
        {...inputProps}
        autoComplete="off"
        className={classes}
        defaultValue={props.value || ''}
        ref={forwardedRef}
        formNoValidate
      />
      {props.label}
      {props.error && props.error.length > 0 && (
        <p className="InputError">{props.error}</p>
      )}
    </label>
  )
})

export default Input
