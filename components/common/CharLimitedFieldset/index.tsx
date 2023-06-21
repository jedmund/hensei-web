import React, {
  ForwardRefRenderFunction,
  forwardRef,
  useEffect,
  useState,
} from 'react'

import classNames from 'classnames'
import './index.scss'

interface Props extends React.HTMLProps<HTMLInputElement> {
  fieldName: string
  placeholder: string
  value?: string
  limit: number
  error: string
  onBlur?: (event: React.ChangeEvent<HTMLInputElement>) => void
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
}

const CharLimitedFieldset: ForwardRefRenderFunction<HTMLInputElement, Props> = (
  {
    fieldName,
    placeholder,
    value,
    limit,
    error,
    onBlur,
    onChange: onInputChange,
    ...props
  },
  ref
) => {
  // States
  const [currentCount, setCurrentCount] = useState(
    () => limit - (value || '').length
  )

  // Hooks
  useEffect(() => {
    setCurrentCount(limit - (value || '').length)
  }, [limit, value])

  // Event handlers
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value: inputValue } = event.currentTarget
    setCurrentCount(limit - inputValue.length)
    if (onInputChange) {
      onInputChange(event)
    }
  }

  // Rendering methods
  return (
    <fieldset className="Fieldset">
      <div className={classNames({ Joined: true }, props.className)}>
        <input
          {...props}
          data-1p-ignore
          autoComplete="off"
          className="Input"
          type={props.type}
          name={fieldName}
          placeholder={placeholder}
          defaultValue={value || ''}
          onBlur={onBlur}
          onChange={handleInputChange}
          maxLength={limit}
          ref={ref}
          formNoValidate
        />
        <span className="Counter">{currentCount}</span>
      </div>
      {error.length > 0 && <p className="InputError">{error}</p>}
    </fieldset>
  )
}

export default forwardRef(CharLimitedFieldset)
