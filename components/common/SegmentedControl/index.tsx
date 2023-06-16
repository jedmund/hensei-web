import React from 'react'
import classNames from 'classnames'
import './index.scss'

interface Props {
  className?: string
  elementClass?: string
  blended?: boolean
  tabIndex?: number
}

const SegmentedControl: React.FC<Props> = ({
  className,
  elementClass,
  blended,
  tabIndex,
  children,
}) => {
  const classes = classNames(
    {
      SegmentedControl: true,
      Blended: blended,
    },
    className,
    elementClass
  )
  return (
    <div className="SegmentedControlWrapper" tabIndex={tabIndex}>
      <div className={classes}>{children}</div>
    </div>
  )
}

SegmentedControl.defaultProps = {
  blended: false,
}

export default SegmentedControl
