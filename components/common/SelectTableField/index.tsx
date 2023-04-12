import classNames from 'classnames'
import { useEffect, useState } from 'react'
import Select from '~components/common/Select'
import TableField from '~components/common/TableField'

import './index.scss'

interface Props {
  name: string
  label: string
  description?: string
  open: boolean
  value?: string
  className?: string
  imageAlt?: string
  imageClass?: string
  imageSrc?: string[]
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
      imageAlt={props.imageAlt}
      imageClass={props.imageClass}
      imageSrc={props.imageSrc}
      label={props.label}
    >
      <Select
        name={props.name}
        open={props.open}
        onOpenChange={props.onOpenChange}
        onValueChange={props.onChange}
        onClose={props.onClose}
        triggerClass={classNames({ Bound: true, Table: true })}
        value={value}
        overlayVisible={false}
      >
        {props.children}
      </Select>
    </TableField>
  )
}

export default SelectTableField
