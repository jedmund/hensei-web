import React from 'react'
import * as RadixSwitch from '@radix-ui/react-switch'

import classNames from 'classnames'
import './index.scss'

interface Props
  extends React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > {
  thumbClass?: string
  onCheckedChange: (checked: boolean) => void
}

const Switch = (props: Props) => {
  const {
    checked,
    className,
    disabled,
    name,
    onCheckedChange,
    required,
    thumbClass,
    value,
  } = props

  const mainClasses = classNames({ Switch: true }, className)
  const thumbClasses = classNames({ SwitchThumb: true }, thumbClass)

  return (
    <RadixSwitch.Root
      className={mainClasses}
      checked={checked}
      name={name}
      disabled={disabled}
      required={required}
      value={value}
      tabIndex={props.tabIndex}
      onCheckedChange={onCheckedChange}
    >
      <RadixSwitch.Thumb className={thumbClasses} />
    </RadixSwitch.Root>
  )
}

export default Switch
