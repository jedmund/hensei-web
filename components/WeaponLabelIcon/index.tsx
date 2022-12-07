import React from 'react'
import { useRouter } from 'next/router'

import './index.scss'

interface Props {
  labelType: string
}

const WeaponLabelIcon = (props: Props) => {
  const router = useRouter()

  return <i className={`WeaponLabelIcon ${props.labelType} ${router.locale}`} />
}

export default WeaponLabelIcon
