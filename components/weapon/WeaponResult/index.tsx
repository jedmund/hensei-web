'use client'
import React from 'react'
import { useRouter } from 'next/navigation'
import { getCookie } from 'cookies-next'

import UncapIndicator from '~components/uncap/UncapIndicator'
import WeaponLabelIcon from '~components/weapon/WeaponLabelIcon'

import styles from './index.module.scss'

interface Props {
  data: Weapon
  onClick: () => void
}

const Element = ['null', 'wind', 'fire', 'water', 'earth', 'dark', 'light']
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
    getCookie('NEXT_LOCALE') && ['en', 'ja'].includes(getCookie('NEXT_LOCALE') as string) 
      ? (getCookie('NEXT_LOCALE') as string) 
      : 'en'
  const weapon = props.data

  return (
    <li className={styles.result} onClick={props.onClick}>
      <img
        alt={weapon.name[locale]}
        src={`${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-grid/${weapon.granblue_id}.jpg`}
      />
      <div className={styles.info}>
        <h5>{weapon.name[locale]}</h5>
        <UncapIndicator
          type="weapon"
          flb={weapon.uncap.flb}
          ulb={weapon.uncap.ulb}
          transcendence={weapon.uncap.transcendence}
          transcendenceStage={5}
          special={false}
        />
        <div className={styles.tags}>
          <WeaponLabelIcon labelType={Element[weapon.element]} />
          <WeaponLabelIcon labelType={Proficiency[weapon.proficiency]} />
        </div>
      </div>
    </li>
  )
}

export default WeaponResult
