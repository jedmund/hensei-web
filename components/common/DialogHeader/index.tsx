import React, { PropsWithChildren } from 'react'
import classNames from 'classnames'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import CrossIcon from '~public/icons/Cross.svg'
import styles from './index.module.scss'

interface Props extends DialogPrimitive.DialogProps {
  title: string
  subtitle?: string
  image?: {
    alt: string
    src: string
  }
}

export const DialogHeader = React.forwardRef<HTMLDivElement, Props>(
  function dialogHeader(
    { title, subtitle, image, children, ...props }: PropsWithChildren<Props>,
    forwardedRef
  ) {
    const classes = classNames({
      [styles.header]: true,
    })

    return (
      <header {...props} className={classes} ref={forwardedRef}>
        {image && (
          <img alt={image.alt} className={styles.image} src={image.src} />
        )}
        <div className={styles.top}>
          {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
          <div className={styles.title}>{title}</div>
        </div>
        <DialogPrimitive.Close className={styles.close}>
          <CrossIcon />
        </DialogPrimitive.Close>
      </header>
    )
  }
)

export default DialogHeader
