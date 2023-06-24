import classNames from 'classnames'
import React from 'react'

import styles from './index.module.scss'

interface Props
  extends React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  > {
  active?: boolean
}

const Token = React.forwardRef<HTMLDivElement, Props>(function token(
  { children, className, ...props },
  forwardedRef
) {
  const classes = classNames(
    {
      [styles.token]: true,
      [styles.on]: props.active,
      [styles.off]: !props.active,
    },
    className && styles[className]
  )
  return (
    <div className={classes} ref={forwardedRef}>
      {children}
    </div>
  )
})

Token.defaultProps = {
  active: true,
}

export default Token
