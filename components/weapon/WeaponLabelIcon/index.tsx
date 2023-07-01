import React from 'react'
import { useRouter } from 'next/router'
import classNames from 'classnames'

import styles from './index.module.scss'

interface Props {
  labelType: string
}

const WeaponLabelIcon = (props: Props) => {
  const router = useRouter()

  const classes = classNames({
    [styles.icon]: true,
    [styles[props.labelType]]: true,
    [styles.en]: router.locale === 'en',
    [styles.ja]: router.locale === 'ja',
  })

  return <i className={classes} />
}

export default WeaponLabelIcon
