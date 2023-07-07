import React from 'react'
import { useRouter } from 'next/router'

import UncapIndicator from '~components/uncap/UncapIndicator'
import WeaponLabelIcon from '~components/weapon/WeaponLabelIcon'

import styles from './index.module.scss'

interface Props {
  data: Weapon
  onClick: () => void
}

const Proficiency = [
  'none',
  'sword',
  'dagger',
  'axe',
  'spear',
  'bow',
  'staff',
  'fist',
  'harp',
  'gun',
  'katana',
]

const WeaponResult = (props: Props) => {
  const router = useRouter()
  const locale =
    router.locale && ['en', 'ja'].includes(router.locale) ? router.locale : 'en'
  const weapon = props.data

  return (
    <li className={styles.result} onClick={props.onClick}>
      <img
        alt={weapon.name[locale]}
        src={`${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-grid/${weapon.granblueId}.jpg`}
      />
      <div className={styles.info}>
        <h5>{weapon.name[locale]}</h5>
        <UncapIndicator
          type="weapon"
          flb={weapon.uncap.flb}
          ulb={weapon.uncap.ulb}
          special={false}
        />
        <div className={styles.tags}>
          <WeaponLabelIcon labelType={weapon.element.slug} />
          <WeaponLabelIcon labelType={Proficiency[weapon.proficiency]} />
        </div>
      </div>
    </li>
  )
}

export default WeaponResult
