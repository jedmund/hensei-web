import React from 'react'
import classnames from 'classnames'

import styles from './index.module.scss'

interface Props {
  stage: number
  interactive: boolean
  visible: boolean
  onClick?: (index: number) => void
  onHover?: (index: number) => void
}

const TranscendenceFragment = ({
  interactive,
  stage,
  visible,
  onClick,
  onHover,
}: Props) => {
  const classes = classnames({
    Fragment: true,
    Visible: visible,
    Stage1: stage === 1,
    Stage2: stage === 2,
    Stage3: stage === 3,
    Stage4: stage === 4,
    Stage5: stage === 5,
  })

  function handleClick() {
    if (interactive && onClick) onClick(stage)
  }

  function handleHover() {
    if (interactive && onHover) onHover(stage)
  }

  return (
    <i className={classes} onClick={handleClick} onMouseOver={handleHover} />
  )
}

TranscendenceFragment.defaultProps = {
  interactive: false,
  visible: false,
}

export default TranscendenceFragment
