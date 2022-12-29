import React, { useEffect, useState } from 'react'
import classNames from 'classnames'
import './index.scss'

interface Props {
  visible: boolean
  open: boolean
}

const defaultProps = {
  visible: true,
}

const Overlay = ({
  visible: displayed,
  open,
}: {
  visible: boolean
  open: boolean
}) => {
  const [visible, setVisible] = useState(open)

  const classes = classNames({
    Overlay: true,
    Visible: displayed,
  })

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
    event.stopPropagation()
  }

  return visible ? <div className={classes} onClick={handleClick} /> : null
}

Overlay.defaultProps = defaultProps

export default Overlay
