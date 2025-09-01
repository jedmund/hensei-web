'use client'
import React from 'react'
import { getCookie } from 'cookies-next'

import styles from './index.module.scss'

interface Props {
  data: Guidebook
  onClick: () => void
}

const GuidebookResult = (props: Props) => {
  const locale = (getCookie('NEXT_LOCALE') as string) || 'en'

  const guidebook = props.data

  return (
    <li className={styles.result} onClick={props.onClick}>
      <img
        alt={guidebook.name[locale]}
        src={`${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/guidebooks/book_${guidebook.granblue_id}.png`}
      />
      <div className={styles.info}>
        <h5>{guidebook.name[locale]}</h5>
        <p>{guidebook.description[locale]}</p>
      </div>
    </li>
  )
}

export default GuidebookResult
