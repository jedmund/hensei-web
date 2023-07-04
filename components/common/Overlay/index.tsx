import React, { useEffect, useState } from 'react'
import classNames from 'classnames'
import styles from './index.module.scss'

interface Props {
  className?: string
  visible: boolean
  open: boolean
  onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
}

const defaultProps = {
  visible: true,
}

const Overlay = React.forwardRef<HTMLDivElement, Props>(function Overlay(
  { className, visible: displayed, open, onClick }: Props,
  forwardedRef
) {
  const [visible, setVisible] = useState(open)

  const classes = classNames(
    {
      [styles.overlay]: true,
      [styles.visible]: displayed,
    },
    className?.split(' ').map((c) => styles[c])
  )

  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setVisible(false)
      }, 200)
      return () => {
        clearTimeout(timer)
      }
    }
    setVisible(true)
    return () => {}
  }, [open])

  function handleClick(event: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    // event.stopPropagation()
    if (onClick) onClick(event)
  }

  return visible ? (
    <div className={classes} onClick={handleClick} ref={forwardedRef} />
  ) : null
})

Overlay.defaultProps = defaultProps

export default Overlay
