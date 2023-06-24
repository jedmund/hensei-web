import React from 'react'
import classnames from 'classnames'

import styles from './index.module.scss'

interface Props
  extends React.DetailedHTMLProps<
    React.DialogHTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  > {
  empty: boolean
  special: boolean
  flb: boolean
  ulb: boolean
  index: number
  onStarClick: (index: number, empty: boolean) => void
}

const UncapStar = (props: Props) => {
  const classes = classnames({
    [styles.star]: true,
    [styles.empty]: props.empty,
    [styles.special]: props.special,
    [styles.mlb]: !props.special,
    [styles.flb]: props.flb,
    [styles.ulb]: props.ulb,
  })

  function clicked() {
    props.onStarClick(props.index, props.empty)
  }

  return (
    <li className={classes} tabIndex={props.tabIndex} onClick={clicked}></li>
  )
}

UncapStar.defaultProps = {
  empty: false,
  special: false,
  flb: false,
  ulb: false,
}

export default UncapStar
