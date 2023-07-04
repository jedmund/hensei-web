import { useEffect, useState } from 'react'
import classNames from 'classnames'
import Switch from '~components/common/Switch'
import TableField from '~components/common/TableField'

import styles from './index.module.scss'

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  label: string
  description?: string
  disabled?: boolean
  value?: boolean
  className?: string
  tabIndex?: number
  image?: {
    className?: String
    alt?: string
    src: string[]
  }
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

  const classes = classNames(
    {
      switch: true,
      disabled: props.disabled,
    },
    props.className
  )

  return (
    <TableField
      name={props.name}
      description={props.description}
      className={classes}
      image={props.image}
      label={props.label}
    >
      <Switch
        name={props.name}
        checked={value}
        disabled={props.disabled}
        tabIndex={props.tabIndex}
        onCheckedChange={onValueChange}
      />
    </TableField>
  )
}

export default SwitchTableField
