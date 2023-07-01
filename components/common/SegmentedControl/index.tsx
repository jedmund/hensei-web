import React, { PropsWithChildren } from 'react'
import classNames from 'classnames'
import styles from './index.module.scss'

interface Props {
  className?: string
  wrapperClassName?: string
  elementClass?: string
  blended?: boolean
  grow?: boolean
  gap?: boolean
  tabIndex?: number
}

const SegmentedControl = React.forwardRef<
  HTMLDivElement,
  PropsWithChildren<Props>
>(function SegmentedControl(
  {
    className,
    wrapperClassName,
    elementClass,
    blended,
    grow,
    gap,
    tabIndex,
    children,
  },
  forwardedRef
) {
  const wrapperClasses = classNames(
    {
      [styles.wrapper]: true,
    },
    wrapperClassName?.split(' ').map((className) => styles[className])
  )

  const classes = classNames(
    {
      [styles.segmentedControl]: true,
      [styles.blended]: blended,
      [styles.grow]: grow,
      [styles.gap]: gap,
      blended: blended,
    },
    className?.split(' ').map((className) => styles[className]),
    elementClass
  )
  return (
    <div className={wrapperClasses} tabIndex={tabIndex} ref={forwardedRef}>
      <div className={classes}>{children}</div>
    </div>
  )
})

SegmentedControl.defaultProps = {
  blended: false,
  grow: false,
  gap: false,
}

export default SegmentedControl
