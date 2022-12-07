import React from 'react'
import { useRouter } from 'next/router'

import UncapIndicator from '~components/UncapIndicator'
import WeaponLabelIcon from '~components/WeaponLabelIcon'

import './index.scss'

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
const Series = [
  'seraphic',
  'grand',
  'opus',
  'draconic',
  'revenant',
  'primal',
  'beast',
  'regalia',
  'omega',
  'olden_primal',
  'hollowsky',
  'xeno',
  'astral',
  'rose',
  'ultima',
  'bahamut',
  'epic',
  'ennead',
  'cosmos',
  'ancestral',
  'superlative',
  'vintage',
  'class_champion',
  'sephira',
  'new_world_foundation',
]

const WeaponResult = (props: Props) => {
  const router = useRouter()
  const locale =
    router.locale && ['en', 'ja'].includes(router.locale) ? router.locale : 'en'
  const weapon = props.data

  return (
    <li className="WeaponResult" onClick={props.onClick}>
      <img
        alt={weapon.name[locale]}
        src={`${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-grid/${weapon.granblue_id}.jpg`}
      />
      <div className="Info">
        <h5>{weapon.name[locale]}</h5>
        <UncapIndicator
          type="weapon"
          flb={weapon.uncap.flb}
          ulb={weapon.uncap.ulb}
          special={false}
        />
        <div className="tags">
          <WeaponLabelIcon labelType={Element[weapon.element]} />
          <WeaponLabelIcon labelType={Proficiency[weapon.proficiency]} />
        </div>
      </div>
    </li>
  )
}

export default WeaponResult
