import React from 'react'
import { useRouter } from 'next/router'

import UncapIndicator from '~components/UncapIndicator'
import WeaponLabelIcon from '~components/WeaponLabelIcon'

import './index.scss'

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
    <li className="SummonResult" onClick={props.onClick}>
      <img
        alt={summon.name[locale]}
        src={`${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/summon-grid/${summon.granblue_id}.jpg`}
      />
      <div className="Info">
        <h5>{summon.name[locale]}</h5>
        <UncapIndicator
          type="summon"
          flb={summon.uncap.flb}
          ulb={summon.uncap.ulb}
          special={false}
        />
        <div className="tags">
          <WeaponLabelIcon labelType={Element[summon.element]} />
        </div>
      </div>
    </li>
  )
}

export default SummonResult
