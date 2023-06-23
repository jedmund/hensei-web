import React from 'react'
import { useRouter } from 'next/router'

import styles from './index.module.scss'

interface Props {
  data: Guidebook
  onClick: () => void
}

const GuidebookResult = (props: Props) => {
  const router = useRouter()
  const locale =
    router.locale && ['en', 'ja'].includes(router.locale) ? router.locale : 'en'

  const guidebook = props.data

  return (
    <li className="GuidebookResult" onClick={props.onClick}>
      <img
        alt={guidebook.name[locale]}
        src={`${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/guidebooks/book_${guidebook.granblue_id}.png`}
      />
      <div className="Info">
        <h5>{guidebook.name[locale]}</h5>
        <p>{guidebook.description[locale]}</p>
      </div>
    </li>
  )
}

export default GuidebookResult
