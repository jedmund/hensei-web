import React, {
  ComponentProps,
  PropsWithChildren,
  ReactNode,
  useEffect,
  useState,
} from 'react'
import classNames from 'classnames'

import * as PopoverPrimitive from '@radix-ui/react-popover'
import ChevronIcon from '~public/icons/Chevron.svg'

import './index.scss'

interface Props extends ComponentProps<'div'> {
  open: boolean
  disabled?: boolean
  icon?: {
    src: string
    alt: string
  }
  trigger?: {
    className?: string
    placeholder?: string
  }
  value?: {
    element: ReactNode
    rawValue: string
  }
  onOpenChange?: () => void
}

const Popover = React.forwardRef<HTMLDivElement, Props>(function Popover(
  { children, ...props }: PropsWithChildren<Props>,
  forwardedRef
) {
  // Component state
  const [open, setOpen] = useState(false)

  // Element classes
  const triggerClasses = classNames(
    {
      SelectTrigger: true,
      Disabled: props.disabled,
    },
    props.trigger?.className
  )

  // Hooks
  useEffect(() => {
    setOpen(props.open)
  }, [props.open])

  // Elements
  const value = props.value ? (
    <span className="Value" data-value={props.value?.rawValue}>
      {props.value?.element}
    </span>
  ) : (
    <span className="Value Empty">{props.placeholder}</span>
  )

  const icon = props.icon ? (
    <img alt={props.icon.alt} src={props.icon.src} />
  ) : (
    ''
  )

  const arrow = !props.disabled ? (
    <i className="SelectIcon">
      <ChevronIcon />
    </i>
  ) : (
    ''
  )

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={props.onOpenChange}
      modal={true}
    >
      <PopoverPrimitive.Trigger
        className={triggerClasses}
        data-placeholder={!props.value}
      >
        {icon}
        {value}
        {arrow}
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Content
        className={classNames({ Popover: true }, props.className)}
        sideOffset={8}
        ref={forwardedRef}
      >
        {children}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Root>
  )
})

Popover.defaultProps = {
  disabled: false,
}

export default Popover
