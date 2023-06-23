import React from 'react'
import * as RadixSelect from '@radix-ui/react-select'

import styles from './index.module.scss'

// Props
interface Props {
  label?: string
  separator?: boolean
  children?: React.ReactNode
}

const defaultProps = {
  separator: true,
}

const SelectGroup = (props: Props) => {
  return (
    <React.Fragment>
      <RadixSelect.Group className="SelectGroup">
        <RadixSelect.Label className="Label">
          {props.label}
          <RadixSelect.Separator className="Separator" />
        </RadixSelect.Label>
        {props.children}
      </RadixSelect.Group>
    </React.Fragment>
  )
}

SelectGroup.defaultProps = defaultProps

export default SelectGroup
