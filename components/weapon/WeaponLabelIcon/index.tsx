'use client'
import React from 'react'
import { useRouter } from 'next/navigation'
import classNames from 'classnames'
import { getCookie } from 'cookies-next'

import styles from './index.module.scss'

interface Props {
  labelType: string
  size: 'small' | 'normal'
}

const WeaponLabelIcon = (props: Props) => {
  const router = useRouter()

  const locale = getCookie('NEXT_LOCALE') as string || 'en'
  const classes = classNames({
    [styles.icon]: true,
    [styles.small]: props.size === 'small',
    [styles[props.labelType]]: true,
    [styles.en]: locale === 'en',
    [styles.ja]: locale === 'ja',
  })

  return <i className={classes} />
}

WeaponLabelIcon.defaultProps = {
  size: 'normal',
}

export default WeaponLabelIcon
