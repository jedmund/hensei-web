import { useEffect, useState } from 'react'
import Select from '~components/common/Select'
import TableField from '~components/common/TableField'

interface Props {
  autoFocus?: boolean
  name: string
  label: string
  description?: string
  open: boolean
  value?: string
  className?: string
  image?: {
    className?: String
    alt?: string
    src: string[]
  }
  children: React.ReactNode
  onOpenChange: () => void
  onChange: (value: string) => void
  onClose: () => void
}

const SelectTableField = (props: Props) => {
  const [value, setValue] = useState('')

  useEffect(() => {
    if (props.value) setValue(props.value)
  }, [props.value])

  return (
    <TableField
      name={props.name}
      image={props.image}
      className="select"
      label={props.label}
    >
      <Select
        autoFocus={props.autoFocus}
        name={props.name}
        open={props.open}
        onOpenChange={props.onOpenChange}
        onValueChange={props.onChange}
        onClose={props.onClose}
        value={value}
        overlayVisible={false}
        trigger={{
          bound: true,
          className: 'table',
        }}
      >
        {props.children}
      </Select>
    </TableField>
  )
}

export default SelectTableField
