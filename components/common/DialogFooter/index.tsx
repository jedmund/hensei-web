import React, { PropsWithChildren } from 'react'
import classNames from 'classnames'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import styles from './index.module.scss'

interface Props extends DialogPrimitive.DialogProps {
  leftElements?: React.ReactNode[]
  rightElements?: React.ReactNode[]
  image?: {
    alt: string
    src: string
  }
}

export const DialogFooter = React.forwardRef<HTMLDivElement, Props>(
  function dialogFooter(
    {
      leftElements,
      rightElements,
      image,
      children,
      ...props
    }: PropsWithChildren<Props>,
    forwardedRef
  ) {
    const classes = classNames({
      [styles.footer]: true,
    })

    return (
      <footer {...props} className={classes} ref={forwardedRef}>
        <div className={styles.left}>{leftElements}</div>
        <div className={styles.right}>{rightElements}</div>
      </footer>
    )
  }
)

export default DialogFooter
