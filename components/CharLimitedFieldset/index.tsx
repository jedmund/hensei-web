import React, { useEffect, useState } from 'react'
import './index.scss'

interface Props {
  fieldName: string
  placeholder: string
  value?: string
  limit: number
  error: string
  onBlur?: (event: React.ChangeEvent<HTMLInputElement>) => void
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
}

const CharLimitedFieldset = React.forwardRef<HTMLInputElement, Props>(
  function useFieldSet(props, ref) {
    const fieldType = ['password', 'confirm_password'].includes(props.fieldName)
      ? 'password'
      : 'text'

    const [currentCount, setCurrentCount] = useState(0)

    useEffect(() => {
      setCurrentCount(
        props.value ? props.limit - props.value.length : props.limit
      )
    }, [props.limit, props.value])

    function onChange(event: React.ChangeEvent<HTMLInputElement>) {
      setCurrentCount(props.limit - event.currentTarget.value.length)
      if (props.onChange) props.onChange(event)
    }

    return (
      <fieldset className="Fieldset">
        <div className="Limited">
          <input
            autoComplete="off"
            className="Input"
            type={fieldType}
            name={props.fieldName}
            placeholder={props.placeholder}
            defaultValue={props.value || ''}
            onBlur={props.onBlur}
            onChange={onChange}
            maxLength={props.limit}
            ref={ref}
            formNoValidate
          />
          <span className="Counter">{currentCount}</span>
        </div>
        {props.error.length > 0 && <p className="InputError">{props.error}</p>}
      </fieldset>
    )
  }
)

export default CharLimitedFieldset
