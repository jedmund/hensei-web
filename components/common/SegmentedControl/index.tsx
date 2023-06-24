import React from 'react'
import classNames from 'classnames'
import styles from './index.module.scss'

interface Props {
  className?: string
  elementClass?: string
  blended?: boolean
  grow?: boolean
  gap?: boolean
  tabIndex?: number
}

const SegmentedControl: React.FC<Props> = ({
  className,
  elementClass,
  blended,
  grow,
  gap,
  tabIndex,
  children,
}) => {
  const classes = classNames(
    {
      [styles.segmentedControl]: true,
      [styles.blended]: blended,
      [styles.grow]: grow,
      [styles.gap]: gap,
    },
    className,
    elementClass
  )
  return (
    <div className={styles.wrapper} tabIndex={tabIndex}>
      <div className={classes}>{children}</div>
    </div>
  )
}

SegmentedControl.defaultProps = {
  blended: false,
  grow: false,
  gap: false,
}

export default SegmentedControl
