import React from 'react'
import classNames from 'classnames'
import * as RadixSwitch from '@radix-ui/react-switch'
import styles from './index.module.scss'

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

  const mainClasses = classNames(
    {
      [styles.switch]: true,
    },
    className?.split(' ').map((c) => styles[c])
  )

  const thumbClasses = classNames(
    {
      [styles.thumb]: true,
    },
    thumbClass?.split(' ').map((c) => styles[c])
  )

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
