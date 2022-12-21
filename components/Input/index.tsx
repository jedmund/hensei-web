import classNames from 'classnames'
import React from 'react'
import './index.scss'

interface Props
  extends React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > {
  contained?: boolean
  error?: string
  label?: string
}

const defaultProps = {
  contained: false,
}

const Input = React.forwardRef<HTMLInputElement, Props>(function input(
  { contained, error, label, ...props },
  forwardedRef
) {
  const classes = classNames(
    {
      Input: true,
      Contained: contained,
    },
    props.className
  )

  return (
    <label className="Label" htmlFor={props.name}>
      <input
        {...props}
        autoComplete="off"
        className={classes}
        defaultValue={props.value || ''}
        ref={forwardedRef}
        formNoValidate
      />
      {label}
      {error && error.length > 0 && <p className="InputError">{error}</p>}
    </label>
  )
})

Input.defaultProps = defaultProps

export default Input
