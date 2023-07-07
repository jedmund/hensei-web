import React from 'react'
import { useRouter } from 'next/router'

import UncapIndicator from '~components/uncap/UncapIndicator'
import WeaponLabelIcon from '~components/weapon/WeaponLabelIcon'

import styles from './index.module.scss'

interface Props {
  data: Summon
  onClick: () => void
}

const SummonResult = (props: Props) => {
  const router = useRouter()
  const locale =
    router.locale && ['en', 'ja'].includes(router.locale) ? router.locale : 'en'

  const summon = props.data

  return (
    <li className={styles.result} onClick={props.onClick}>
      <img
        alt={summon.name[locale]}
        src={`${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/summon-grid/${summon.granblueId}.jpg`}
      />
      <div className={styles.info}>
        <h5>{summon.name[locale]}</h5>
        <UncapIndicator
          type="summon"
          ulb={summon.uncap.ulb || false}
          flb={summon.uncap.flb || false}
          xlb={summon.uncap.xlb || false}
          uncapLevel={6}
          transcendenceStage={5}
          special={false}
        />
        <div className={styles.tags}>
          <WeaponLabelIcon labelType={summon.element.slug} />
        </div>
      </div>
    </li>
  )
}

export default SummonResult
