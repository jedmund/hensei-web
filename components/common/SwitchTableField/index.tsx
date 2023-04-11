import { useEffect, useState } from 'react'
import Switch from '~components/common/Switch'
import TableField from '~components/common/TableField'

import './index.scss'

interface Props {
  name: string
  label: string
  description?: string
  value?: boolean
  className?: string
  imageAlt?: string
  imageClass?: string
  imageSrc?: string[]
  onValueChange: (value: boolean) => void
}

const SwitchTableField = (props: Props) => {
  const [value, setValue] = useState(props.value)

  useEffect(() => {
    if (value !== props.value) setValue(props.value)
  }, [props.value])

  useEffect(() => {
    if (value !== undefined) props.onValueChange(value)
  }, [value])

  function onValueChange(value: boolean) {
    setValue(value)
  }

  return (
    <TableField
      name={props.name}
      className="SwitchField"
      imageAlt={props.imageAlt}
      imageClass={props.imageClass}
      imageSrc={props.imageSrc}
      label={props.label}
    >
      <Switch
        name={props.name}
        checked={value}
        onCheckedChange={onValueChange}
      />
    </TableField>
  )
}

export default SwitchTableField
