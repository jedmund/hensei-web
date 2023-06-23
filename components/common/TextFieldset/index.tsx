import React from 'react'
import styles from './index.module.scss'

interface Props {
  fieldName: string
  placeholder: string
  value?: string
  error: string
  onBlur?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void
  onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void
}

const TextFieldset = React.forwardRef<HTMLTextAreaElement, Props>(
  function fieldSet(props, ref) {
    return (
      <fieldset className="Fieldset">
        <textarea
          className="Input"
          name={props.fieldName}
          placeholder={props.placeholder}
          defaultValue={props.value || ''}
          onBlur={props.onBlur}
          onChange={props.onChange}
          ref={ref}
        />
        {props.error.length > 0 && <p className="InputError">{props.error}</p>}
      </fieldset>
    )
  }
)

export default TextFieldset
