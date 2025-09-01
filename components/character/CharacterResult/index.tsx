'use client'

import React from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { getCookie } from 'cookies-next'

import UncapIndicator from '~components/uncap/UncapIndicator'
import WeaponLabelIcon from '~components/weapon/WeaponLabelIcon'

import styles from './index.module.scss'

interface Props {
  data: Character
  onClick: () => void
}

const Element = ['null', 'wind', 'fire', 'water', 'earth', 'dark', 'light']

const CharacterResult = (props: Props) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const routerLocale = getCookie('NEXT_LOCALE')
  const locale =
    routerLocale && ['en', 'ja'].includes(routerLocale) ? routerLocale : 'en'

  const character = props.data

  const characterUrl = () => {
    let url = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/character-grid/${character.granblue_id}_01.jpg`

    if (character.granblue_id === '3030182000') {
      url = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/character-grid/${character.granblue_id}_01_01.jpg`
    }

    return url
  }

  return (
    <li className={styles.result} onClick={props.onClick}>
      <img alt={character.name[locale]} src={characterUrl()} />
      <div className={styles.info}>
        <h5>{character.name[locale]}</h5>
        <UncapIndicator
          type="character"
          flb={character.uncap.flb}
          ulb={character.uncap.ulb}
          transcendence={character.uncap.ulb}
          transcendenceStage={5}
          special={character.special}
        />
        <div className={styles.tags}>
          <WeaponLabelIcon labelType={Element[character.element]} />
        </div>
      </div>
    </li>
  )
}

export default CharacterResult
