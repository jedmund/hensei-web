import React, { useEffect, useState } from 'react'
import * as RadixSelect from '@radix-ui/react-select'
import classNames from 'classnames'

import ArrowIcon from '~public/icons/Arrow.svg'

import './index.scss'

// Props
interface Props
  extends React.DetailedHTMLProps<
    React.SelectHTMLAttributes<HTMLSelectElement>,
    HTMLSelectElement
  > {
  open: boolean
  placeholder?: string
  trigger?: React.ReactNode
  children?: React.ReactNode
  onClick?: () => void
  onValueChange?: (value: string) => void
  triggerClass?: string
}

const Select = (props: Props) => {
  const [value, setValue] = useState('')

  useEffect(() => {
    if (props.value) setValue(`${props.value}`)
  }, [props.value])

  function onValueChange(newValue: string) {
    setValue(`${newValue}`)
    if (props.onValueChange) props.onValueChange(newValue)
  }

  return (
    <RadixSelect.Root value={value} onValueChange={onValueChange}>
      <RadixSelect.Trigger
        className={classNames('SelectTrigger', props.triggerClass)}
        placeholder={props.placeholder}
      >
        <RadixSelect.Value placeholder={props.placeholder} />
        <RadixSelect.Icon className="SelectIcon">
          <ArrowIcon />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal className="Select">
        <RadixSelect.Content>
          <RadixSelect.ScrollUpButton className="Scroll Up">
            <ArrowIcon />
          </RadixSelect.ScrollUpButton>
          <RadixSelect.Viewport>{props.children}</RadixSelect.Viewport>
          <RadixSelect.ScrollDownButton className="Scroll Down">
            <ArrowIcon />
          </RadixSelect.ScrollDownButton>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  )
}

export default Select
