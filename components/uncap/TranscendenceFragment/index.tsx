import React from 'react'
import classNames from 'classnames'

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
  const classes = classNames({
    [styles.fragment]: true,
    [styles.visible]: visible,
    [styles.stage1]: stage === 1,
    [styles.stage2]: stage === 2,
    [styles.stage3]: stage === 3,
    [styles.stage4]: stage === 4,
    [styles.stage5]: stage === 5,
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
