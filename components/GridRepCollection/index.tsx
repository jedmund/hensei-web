import React from 'react'
import styles from './index.module.scss'

interface Props {
  children: React.ReactNode
}

const GridRepCollection = (props: Props) => {
  return <div className={styles.collection}>{props.children}</div>
}

export default GridRepCollection
