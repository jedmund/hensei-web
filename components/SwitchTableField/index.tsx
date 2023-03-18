import { useEffect, useState } from 'react'
import Switch from '~components/Switch'
import TableField from '~components/TableField'

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
}

const SwitchTableField = (props: Props) => {
  const [value, setValue] = useState(false)

  useEffect(() => {
    if (props.value) setValue(props.value)
  }, [props.value])

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
