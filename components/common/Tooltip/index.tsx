import React, { PropsWithChildren } from 'react'
import classNames from 'classnames'

import * as TooltipPrimitive from '@radix-ui/react-tooltip'

import styles from './index.module.scss'
interface Props extends TooltipPrimitive.TooltipContentProps {
  content: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export default function Tooltip({
  children,
  content,
  open,
  onOpenChange,
  ...props
}: PropsWithChildren<Props>) {
  return (
    <TooltipPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Content
        side="top"
        align="center"
        className={styles.tooltip}
        sideOffset={4}
        {...props}
      >
        {content}
        {/* <TooltipPrimitive.Arrow width={11} height={5} /> */}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Root>
  )
}
