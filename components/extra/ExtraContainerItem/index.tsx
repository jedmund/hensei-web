import React, { PropsWithChildren } from 'react'
import classNames from 'classnames'
import styles from './index.module.scss'

// Props
interface Props {
  title: string
  className?: string
}

const ExtraContainerItem = ({
  title,
  children,
  ...props
}: PropsWithChildren<Props>) => {
  const classes = classNames(
    {
      [styles.item]: true,
    },
    props.className?.split(' ').map((c) => styles[c])
  )

  return (
    <div className={classes}>
      <div className={styles.content}>
        <header className={styles.header}>
          <h3>{title}</h3>
        </header>
        {children}
      </div>
    </div>
  )
}

export default ExtraContainerItem
