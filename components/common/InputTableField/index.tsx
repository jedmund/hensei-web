import { useEffect, useState } from 'react'
import Input from '~components/common/Input'
import TableField from '~components/common/TableField'

import './index.scss'
import classNames from 'classnames'

interface Props
  extends React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > {
  label: string
  description?: string
  imageAlt?: string
  imageClass?: string
  imageSrc?: string[]
  onValueChange: (value?: string) => void
}

const InputTableField = ({
  label,
  description,
  imageAlt,
  imageClass,
  imageSrc,
  ...props
}: Props) => {
  const [inputValue, setInputValue] = useState('')

  useEffect(() => {
    if (props.value) setInputValue(`${props.value}`)
  }, [props.value])

  useEffect(() => {
    props.onValueChange(inputValue)
  }, [inputValue])

  function onInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(`${parseInt(event.currentTarget?.value)}`)
  }

  return (
    <TableField
      {...props}
      name={props.name || ''}
      className={classNames({ InputField: true }, props.className)}
      imageAlt={imageAlt}
      imageClass={imageClass}
      imageSrc={imageSrc}
      label={label}
    >
      <Input
        className="Bound"
        placeholder={props.placeholder}
        value={inputValue ? `${inputValue}` : ''}
        step={1}
        tabIndex={props.tabIndex}
        type={props.type}
        onChange={onInputChange}
      />
    </TableField>
  )
}

export default InputTableField
