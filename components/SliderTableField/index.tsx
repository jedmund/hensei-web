import { useEffect, useState } from 'react'
import Input from '~components/Input'
import Slider from '~components/Slider'
import TableField from '~components/TableField'

import './index.scss'

interface Props {
  name: string
  label: string
  description?: string
  value: number
  className?: string
  imageAlt?: string
  imageClass?: string
  imageSrc?: string[]
  min: number
  max: number
  step: number
  onValueChange: (value: number) => void
}

const SliderTableField = (props: Props) => {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (props.value !== undefined && props.value !== value)
      setValue(props.value)
  }, [props.value])

  useEffect(() => {
    props.onValueChange(value)
  }, [value])

  function onInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    setValue(parseInt(event.currentTarget?.value))
  }

  function onValueChange(value: number[]) {
    setValue(value[0])
  }

  return (
    <TableField
      name={props.name}
      className="SliderField"
      imageAlt={props.imageAlt}
      imageClass={props.imageClass}
      imageSrc={props.imageSrc}
      label={props.label}
    >
      <Slider
        name={props.name}
        min={props.min}
        max={props.max}
        step={props.step}
        value={[value]}
        onValueChange={onValueChange}
      />
      <Input
        className="Bound"
        type="number"
        value={`${value}`}
        min={props.min}
        max={props.max}
        step={props.step}
        onChange={onInputChange}
      />
    </TableField>
  )
}

export default SliderTableField
