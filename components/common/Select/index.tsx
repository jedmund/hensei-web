import React, { useEffect, useState } from 'react'
import * as RadixSelect from '@radix-ui/react-select'
import classNames from 'classnames'

import Overlay from '~components/common/Overlay'

import ChevronIcon from '~public/icons/Chevron.svg'
import styles from './index.module.scss'

// Props
interface Props
  extends React.DetailedHTMLProps<
    React.SelectHTMLAttributes<HTMLSelectElement>,
    HTMLSelectElement
  > {
  open: boolean
  icon?: {
    src: string
    alt: string
  }
  trigger?: {
    bound?: boolean
    className?: string
    placeholder?: string
    size?: 'small' | 'medium' | 'large'
  }
  children?: React.ReactNode
  onOpenChange?: () => void
  onValueChange?: (value: string) => void
  onClose?: () => void
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
      [styles.trigger]: true,
      [styles.disabled]: props.disabled,
      [styles.bound]: props.trigger ? props.trigger.bound : false,
      [styles.small]: props.trigger?.size === 'small',
      [styles.medium]: !props.trigger || props.trigger?.size === 'medium',
      [styles.large]: props.trigger?.size === 'large',
    },
    props.trigger?.className?.split(' ').map((className) => styles[className])
  )

  const selectClasses = classNames(
    {
      [styles.select]: true,
      [styles.bound]: props.trigger ? props.trigger.bound : false,
    },
    props.className?.split(' ').map((className) => styles[className])
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
        autoFocus={props.autoFocus || false}
        className={triggerClasses}
        ref={forwardedRef}
      >
        {props.icon?.src && <img alt={props.icon.alt} src={props.icon.src} />}
        <RadixSelect.Value placeholder={props.trigger?.placeholder} />
        {!props.disabled && (
          <RadixSelect.Icon className={styles.icon}>
            <ChevronIcon />
          </RadixSelect.Icon>
        )}
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <>
          <Overlay
            open={open}
            visible={props.overlayVisible != null ? props.overlayVisible : true}
          />

          <RadixSelect.Content
            align="center"
            className={selectClasses}
            position="popper"
            sideOffset={6}
            onCloseAutoFocus={onCloseAutoFocus}
            onEscapeKeyDown={onEscapeKeyDown}
            onPointerDownOutside={onPointerDownOutside}
          >
            <RadixSelect.ScrollUpButton
              className={classNames({
                [styles.scroll]: true,
                [styles.up]: true,
              })}
            >
              <ChevronIcon />
            </RadixSelect.ScrollUpButton>
            <RadixSelect.Viewport>{props.children}</RadixSelect.Viewport>
            <RadixSelect.ScrollDownButton
              className={classNames({
                [styles.scroll]: true,
                [styles.down]: true,
              })}
            >
              <ChevronIcon />
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
