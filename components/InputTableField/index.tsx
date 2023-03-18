import { useEffect, useState } from 'react'
import Input from '~components/Input'
import TableField from '~components/TableField'

import './index.scss'

interface Props {
  name: string
  label: string
  description?: string
  value?: number
  className?: string
  imageAlt?: string
  imageClass?: string
  imageSrc?: string[]
}

const InputTableField = (props: Props) => {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (props.value) setValue(props.value)
  }, [props.value])

  function onInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    setValue(parseInt(event.currentTarget?.value))
  }

  return (
    <TableField
      name={props.name}
      className="InputField"
      imageAlt={props.imageAlt}
      imageClass={props.imageClass}
      imageSrc={props.imageSrc}
      label={props.label}
    >
      <Input
        className="Bound"
        type="number"
        value={`${value}`}
        step={1}
        onChange={onInputChange}
      />
    </TableField>
  )
}

export default InputTableField