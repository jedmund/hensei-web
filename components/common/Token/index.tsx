import classNames from 'classnames'
import React from 'react'

import './index.scss'

interface Props
  extends React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  > {}

const Token = React.forwardRef<HTMLDivElement, Props>(function Token(
  { children, className, ...props },
  forwardedRef
) {
  const classes = classNames({ Token: true }, className)
  return <div className={classes}>{children}</div>
})

export default Token
