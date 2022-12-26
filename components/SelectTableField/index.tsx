import classNames from 'classnames'
import { useEffect, useState } from 'react'
import Select from '~components/Select'

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

  const image = () => {
    return props.imageSrc && props.imageSrc.length > 0 ? (
      <div className={`preview ${props.imageClass}`}>
        <img
          alt={props.imageAlt}
          srcSet={props.imageSrc.join(', ')}
          src={props.imageSrc[0]}
        />
      </div>
    ) : (
      ''
    )
  }

  return (
    <div className={classNames({ TableField: true }, props.className)}>
      <div className="Left">
        <h3>{props.label}</h3>
        <p>{props.description}</p>
      </div>

      {image()}

      <div className="Right">
        <Select
          name={props.name}
          open={props.open}
          onOpenChange={props.onOpenChange}
          onValueChange={props.onChange}
          onClose={props.onClose}
          triggerClass={classNames({ Bound: true, Table: true })}
          value={value}
        >
          {props.children}
        </Select>
      </div>
    </div>
  )
}

export default SelectTableField
