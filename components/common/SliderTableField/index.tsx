import { useEffect, useState } from 'react'
import Input from '~components/common/Input'
import Slider from '~components/common/Slider'
import TableField from '~components/common/TableField'

interface Props {
  name: string
  label: string
  description?: string
  value?: number
  className?: string
  image?: {
    className?: String
    alt?: string
    src: string[]
  }
  min: number
  max: number
  step: number
  onValueChange: (value: number) => void
}

const SliderTableField = (props: Props) => {
  const [value, setValue] = useState(props.value)

  useEffect(() => {
    if (value !== undefined && value !== props.value) {
      props.onValueChange(value)
    }
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
      className="slider"
      image={props.image}
      label={props.label}
    >
      <Slider
        name={props.name}
        min={props.min}
        max={props.max}
        step={props.step}
        value={[props.value ? props.value : 0]}
        className="table"
        onValueChange={handleValueChange}
        onValueCommit={handleValueCommit}
      />
      <Input
        className="number"
        bound={true}
        type="number"
        value={`${props.value}`}
        min={props.min}
        max={props.max}
        step={props.step}
        onChange={handleInputChange}
        hide1Password={false}
      />
    </TableField>
  )
}

export default SliderTableField
