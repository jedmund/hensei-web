import classNames from "classnames"
import React from "react"

import "./index.scss"

interface Props {
  children: React.ReactNode
}

const GridRepCollection = (props: Props) => {
  const classes = classNames({
    GridRepCollection: true,
  })

  return <div className={classes}>{props.children}</div>
}

export default GridRepCollection
