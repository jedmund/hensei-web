import React from 'react'
import './index.scss'

interface Props {
    fieldName: string
    placeholder: string
    error: string
    onBlur?: (event: React.ChangeEvent<HTMLInputElement>) => void
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
}

const Fieldset = React.forwardRef<HTMLInputElement, Props>((props, ref) => {
    const fieldType = (['password', 'confirm_password'].includes(props.fieldName)) ? 'password' : 'text'
    
    return (
        <fieldset className="Fieldset">
            <input
                autoComplete="off"
                className="Input" 
                name={props.fieldName} 
                type={fieldType}
                placeholder={props.placeholder}
                onBlur={props.onBlur}
                onChange={props.onChange}
                ref={ref}
                formNoValidate
            />
            {
                props.error.length > 0 && 
                <p className='InputError'>{props.error}</p>
            }
        </fieldset>
    )
})

export default Fieldset