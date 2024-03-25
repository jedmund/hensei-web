import React from 'react'
import { useRouter } from 'next/router'

import UncapIndicator from '~components/uncap/UncapIndicator'
import WeaponLabelIcon from '~components/weapon/WeaponLabelIcon'
import CheckIcon from '~public/icons/Check.svg'

import styles from './index.module.scss'

interface Props {
  data: Summon
  onClick: () => void
}

const Element = ['null', 'wind', 'fire', 'water', 'earth', 'dark', 'light']

const SummonResult = (props: Props) => {
  const router = useRouter()
  const locale =
    router.locale && ['en', 'ja'].includes(router.locale) ? router.locale : 'en'

  const summon = props.data

  return (
    <li className={styles.result} onClick={props.onClick}>
      <img
        alt={summon.name[locale]}
        src={`${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/summon-grid/${summon.granblue_id}.jpg`}
      />
      <div className={styles.info}>
        <h5>{summon.name[locale]}</h5>
        <UncapIndicator
          type="summon"
          flb={summon.uncap.flb}
          ulb={summon.uncap.ulb}
          transcendence={summon.uncap.transcendence}
          transcendenceStage={5}
          special={false}
        />
        <div className={styles.tags}>
          <WeaponLabelIcon labelType={Element[summon.element]} />
          <div className={styles.subaura}>
            <CheckIcon />
            <span>Subaura</span>
          </div>
        </div>
      </div>
    </li>
  )
}

export default SummonResult
