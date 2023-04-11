import React from 'react'
import { useRouter } from 'next/router'

import UncapIndicator from '~components/uncap/UncapIndicator'
import WeaponLabelIcon from '~components/weapon/WeaponLabelIcon'

import './index.scss'

interface Props {
  data: Character
  onClick: () => void
}

const Element = ['null', 'wind', 'fire', 'water', 'earth', 'dark', 'light']

const CharacterResult = (props: Props) => {
  const router = useRouter()
  const locale =
    router.locale && ['en', 'ja'].includes(router.locale) ? router.locale : 'en'

  const character = props.data

  const characterUrl = () => {
    let url = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/chara-grid/${character.granblue_id}_01.jpg`

    if (character.granblue_id === '3030182000') {
      url = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/chara-grid/${character.granblue_id}_01_01.jpg`
    }

    return url
  }

  return (
    <li className="CharacterResult" onClick={props.onClick}>
      <img alt={character.name[locale]} src={characterUrl()} />
      <div className="Info">
        <h5>{character.name[locale]}</h5>
        <UncapIndicator
          type="character"
          flb={character.uncap.flb}
          ulb={character.uncap.ulb}
          special={character.special}
        />
        <div className="tags">
          <WeaponLabelIcon labelType={Element[character.element]} />
        </div>
      </div>
    </li>
  )
}

export default CharacterResult
