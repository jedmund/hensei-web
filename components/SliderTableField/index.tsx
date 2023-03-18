import { useEffect, useState } from 'react'
import Input from '~components/Input'
import Slider from '~components/Slider'
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
  min: number
  max: number
  step: number
  onValueChange: (value: number) => void
}

const SliderTableField = (props: Props) => {
  const [value, setValue] = useState(props.value)

  useEffect(() => {
    if (props.value !== undefined && props.value !== value)
      setValue(props.value)
  }, [props.value])

  useEffect(() => {
    if (value !== undefined && value !== props.value) props.onValueChange(value)
  }, [value])

  function handleValueCommit(value: number[]) {
    setValue(value[0])
  }

  function handleValueChange(value: number[]) {
    setValue(value[0])
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    setValue(parseInt(event.currentTarget?.value))
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
        onValueChange={handleValueChange}
        onValueCommit={handleValueCommit}
      />
      <Input
        className="Bound"
        type="number"
        value={`${value}`}
        min={props.min}
        max={props.max}
        step={props.step}
        onChange={handleInputChange}
      />
    </TableField>
  )
}

export default SliderTableField
