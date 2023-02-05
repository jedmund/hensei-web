import React, { useEffect, useState } from 'react'
import * as RadixSelect from '@radix-ui/react-select'
import classNames from 'classnames'

import Overlay from '~components/Overlay'

import ArrowIcon from '~public/icons/Arrow.svg'

import './index.scss'

// Props
interface Props
  extends React.DetailedHTMLProps<
    React.SelectHTMLAttributes<HTMLSelectElement>,
    HTMLSelectElement
  > {
  altText?: string
  iconSrc?: string
  open: boolean
  trigger?: React.ReactNode
  children?: React.ReactNode
  onOpenChange?: () => void
  onValueChange?: (value: string) => void
  onClose?: () => void
  triggerClass?: string
  overlayVisible?: boolean
}

const Select = React.forwardRef<HTMLButtonElement, Props>(function Select(
  props: Props,
  forwardedRef
) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')

  const triggerClasses = classNames(
    {
      SelectTrigger: true,
      Disabled: props.disabled,
    },
    props.triggerClass
  )

  useEffect(() => {
    setOpen(props.open)
  }, [props.open])

  useEffect(() => {
    if (props.value && props.value !== '') setValue(`${props.value}`)
    else setValue('')
  }, [props.value])

  function onValueChange(newValue: string) {
    setValue(`${newValue}`)
    if (props.onValueChange) props.onValueChange(newValue)
  }

  function onCloseAutoFocus() {
    setOpen(false)
    if (props.onClose) props.onClose()
  }

  function onEscapeKeyDown() {
    setOpen(false)
    if (props.onClose) props.onClose()
  }

  function onPointerDownOutside() {
    setOpen(false)
    if (props.onClose) props.onClose()
  }

  return (
    <RadixSelect.Root
      open={open}
      value={value !== '' ? value : undefined}
      onValueChange={onValueChange}
      onOpenChange={props.onOpenChange}
    >
      <RadixSelect.Trigger
        className={triggerClasses}
        placeholder={props.placeholder}
        ref={forwardedRef}
      >
        {props.iconSrc ? <img alt={props.altText} src={props.iconSrc} /> : ''}
        <RadixSelect.Value placeholder={props.placeholder} />
        {!props.disabled ? (
          <RadixSelect.Icon className="SelectIcon">
            <ArrowIcon />
          </RadixSelect.Icon>
        ) : (
          ''
        )}
      </RadixSelect.Trigger>

      <RadixSelect.Portal className="Select">
        <>
          <Overlay
            open={open}
            visible={props.overlayVisible != null ? props.overlayVisible : true}
          />

          <RadixSelect.Content
            className="Select"
            onCloseAutoFocus={onCloseAutoFocus}
            onEscapeKeyDown={onEscapeKeyDown}
            onPointerDownOutside={onPointerDownOutside}
          >
            <RadixSelect.ScrollUpButton className="Scroll Up">
              <ArrowIcon />
            </RadixSelect.ScrollUpButton>
            <RadixSelect.Viewport>{props.children}</RadixSelect.Viewport>
            <RadixSelect.ScrollDownButton className="Scroll Down">
              <ArrowIcon />
            </RadixSelect.ScrollDownButton>
          </RadixSelect.Content>
        </>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  )
})

Select.defaultProps = {
  overlayVisible: true,
}

export default Select
