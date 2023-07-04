import React, { PropsWithChildren } from 'react'
import styles from './index.module.scss'

interface Props {}

const ExtraContainer = (props: PropsWithChildren<Props>) => {
  return <section className={styles.container}>{props.children}</section>
}

export default ExtraContainer
