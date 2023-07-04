import React, { useEffect, useState } from 'react'
import classNames from 'classnames'
import styles from './index.module.scss'

interface Props extends React.ComponentProps<'input'> {
  bound?: boolean
  error?: string
  label?: string
  fieldsetClassName?: String
  wrapperClassName?: string
  hide1Password?: boolean
  showCounter?: boolean
}

const defaultProps = {
  bound: false,
  hide1Password: true,
  showCounter: false,
}

const Input = React.forwardRef<HTMLInputElement, Props>(function Input(
  {
    value: initialValue,
    bound,
    label,
    error,
    showCounter,
    fieldsetClassName,
    wrapperClassName,
    ...props
  }: Props,
  forwardedRef
) {
  // States
  const [value, setValue] = useState(initialValue)
  const [currentCount, setCurrentCount] = useState(() =>
    props.maxLength ? props.maxLength - (`${value}` || '').length : 0
  )

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  // Classes
  const fieldsetClasses = classNames(
    {
      [styles.fieldset]: true,
    },
    fieldsetClassName?.split(' ').map((className) => styles[className])
  )

  const inputWrapperClasses = classNames(
    {
      [styles.wrapper]: true,
      [styles.accessory]: showCounter,
      [styles.input]: showCounter,
      [styles.bound]: showCounter && bound,
    },
    wrapperClassName?.split(' ').map((className) => styles[className])
  )

  const inputClasses = classNames(
    {
      [styles.input]: !showCounter,
      [styles.bound]: !showCounter && bound,
    },
    !showCounter &&
      props.className?.split(' ').map((className) => styles[className])
  )
  const { defaultValue, hide1Password, ...inputProps } = props

  // Hooks
  useEffect(() => {
    if (props.maxLength)
      setCurrentCount(props.maxLength - (`${value}` || '').length)
  }, [props.maxLength, value])

  // Event handlers
  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setValue(event.target.value)
    if (props.onChange) props.onChange(event)
  }

  // Rendering
  const input = (
    <div className={inputWrapperClasses}>
      <input
        {...inputProps}
        data-1p-ignore={props.hide1Password}
        autoComplete={props.autoComplete}
        className={inputClasses}
        type={props.type}
        name={props.name}
        placeholder={props.placeholder}
        value={value || ''}
        onBlur={props.onBlur}
        onChange={handleChange}
        maxLength={props.maxLength}
        ref={forwardedRef}
        formNoValidate
      />
      <span className={styles.counter}>{currentCount}</span>
    </div>
  )

  const fieldset = (
    <fieldset className={fieldsetClasses}>
      {label && <legend className={styles.legend}>{label}</legend>}
      {input}
      {error && <span className={styles.error}>{error}</span>}
    </fieldset>
  )

  return fieldset
})

Input.defaultProps = defaultProps

export default Input
