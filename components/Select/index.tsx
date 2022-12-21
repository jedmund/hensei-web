import React from 'react'
import * as RadixSelect from '@radix-ui/react-select'
import classNames from 'classnames'

import ArrowIcon from '~public/icons/Arrow.svg'

import './index.scss'

// Props
interface Props {
  open: boolean
  defaultValue?: string | number
  placeholder?: string
  name?: string
  children?: React.ReactNode
  onClick?: () => void
  onChange?: (value: string) => void
  triggerClass?: string
}

const Select = React.forwardRef<HTMLButtonElement, Props>(function useFieldSet(
  props,
  ref
) {
  return (
    <RadixSelect.Root
      defaultValue={props.defaultValue as string}
      name={props.name}
      onValueChange={props.onChange}
    >
      <RadixSelect.Trigger
        className={classNames('SelectTrigger', props.triggerClass)}
        placeholder={props.placeholder}
        ref={ref}
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
})

export default Select
