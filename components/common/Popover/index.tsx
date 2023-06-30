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

import styles from './index.module.scss'

interface Props extends ComponentProps<'div'> {
  open: boolean
  disabled?: boolean
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
  triggerTabIndex?: number
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
      [styles.trigger]: true,
      [styles.disabled]: props.disabled,
      [styles.bound]: props.trigger ? props.trigger.bound : false,
      [styles.small]: props.trigger?.size === 'small',
      [styles.medium]: !props.trigger || props.trigger?.size === 'medium',
      [styles.large]: props.trigger?.size === 'large',
    },
    props.trigger?.className?.split(' ').map((className) => styles[className])
  )

  const popoverClasses = classNames(
    {
      [styles.popover]: true,
    },
    props.className?.split(' ').map((className) => styles[className])
  )

  // Hooks
  useEffect(() => {
    setOpen(props.open)
  }, [props.open])

  // Elements
  const value = props.value ? (
    <span className={styles.value} data-value={props.value?.rawValue}>
      {props.value?.element}
    </span>
  ) : (
    <span
      className={classNames({
        [styles.value]: true,
        [styles.empty]: true,
      })}
    >
      {props.placeholder}
    </span>
  )

  const icon = props.icon ? (
    <img alt={props.icon.alt} src={props.icon.src} />
  ) : (
    ''
  )

  const arrow = !props.disabled ? (
    <i className={styles.icon}>
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
        tabIndex={props.triggerTabIndex}
      >
        {icon}
        {value}
        {arrow}
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Content
        className={popoverClasses}
        sideOffset={6}
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
