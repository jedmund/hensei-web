import { useEffect, useState } from 'react'
import Input from '~components/common/Input'
import TableField from '~components/common/TableField'

import styles from './index.module.scss'

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
  onValueChange: (value?: string | number | readonly string[]) => void
}

const InputTableField = ({
  label,
  description,
  imageAlt,
  imageClass,
  imageSrc,
  ...props
}: Props) => {
  const [inputValue, setInputValue] = useState<
    string | number | readonly string[]
  >()

  useEffect(() => {
    if (props.value !== undefined) setInputValue(props.value)
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
      className={styles.nameField}
      image={{
        alt: imageAlt,
        className: imageClass,
        src: imageSrc ? imageSrc : [],
      }}
      label={label}
    >
      <Input
        className={props.className}
        placeholder={props.placeholder}
        value={inputValue !== undefined ? inputValue : ''}
        step={1}
        tabIndex={props.tabIndex}
        bound={true}
        type={props.type}
        onChange={onInputChange}
      />
    </TableField>
  )
}

export default InputTableField
