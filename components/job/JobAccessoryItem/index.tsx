'use client'
import React from 'react'
import { getCookie } from 'cookies-next'

import * as RadioGroup from '@radix-ui/react-radio-group'

import styles from './index.module.scss'

interface Props {
  accessory: JobAccessory
  selected: boolean
}

const JobAccessoryItem = ({ accessory, selected }: Props) => {
  // Localization
  const locale = (getCookie('NEXT_LOCALE') as string) || 'en'

  return (
    <RadioGroup.Item
      className={styles.item}
      data-state={selected ? 'checked' : 'unchecked'}
      value={accessory.id}
    >
      <img
        alt={accessory.name[locale]}
        src={`${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/accessory-grid/${accessory.granblue_id}.jpg`}
      />
      <h4>{accessory.name[locale]}</h4>
    </RadioGroup.Item>
  )
}

export default JobAccessoryItem
