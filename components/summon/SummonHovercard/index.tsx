import React from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'

import {
  Hovercard,
  HovercardContent,
  HovercardTrigger,
} from '~components/common/Hovercard'
import Button from '~components/common/Button'
import WeaponLabelIcon from '~components/weapon/WeaponLabelIcon'
import UncapIndicator from '~components/uncap/UncapIndicator'

import './index.scss'

interface Props {
  gridSummon: GridSummon
  children: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  onTriggerClick: () => void
}

const SummonHovercard = (props: Props) => {
  const router = useRouter()
  const { t } = useTranslation('common')
  const locale =
    router.locale && ['en', 'ja'].includes(router.locale) ? router.locale : 'en'

  const Element = ['null', 'wind', 'fire', 'water', 'earth', 'dark', 'light']

  const tintElement = Element[props.gridSummon.object.element]

  function goTo() {
    const urlSafeName = props.gridSummon.object.name.en.replaceAll(' ', '_')
    const url = `https://gbf.wiki/${urlSafeName}`

    window.open(url, '_blank')
  }

  function summonImage() {
    let imgSrc = ''

    if (props.gridSummon) {
      const summon = props.gridSummon.object

      const upgradedSummons = [
        '2040094000',
        '2040100000',
        '2040080000',
        '2040098000',
        '2040090000',
        '2040084000',
        '2040003000',
        '2040056000',
      ]

      let suffix = ''
      if (
        upgradedSummons.indexOf(summon.granblue_id.toString()) != -1 &&
        props.gridSummon.uncap_level == 5
      ) {
        suffix = '_02'
      } else if (
        props.gridSummon.object.uncap.xlb &&
        props.gridSummon.transcendence_step > 0
      ) {
        suffix = '_03'
      }

      // Generate the correct source for the summon
      imgSrc = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/summon-grid/${summon.granblue_id}${suffix}.jpg`
    }

    return imgSrc
  }

  const wikiButton = (
    <Button
      className={tintElement}
      text={t('buttons.wiki')}
      onClick={goTo}
      contained={true}
    />
  )

  return (
    <Hovercard openDelay={350}>
      <HovercardTrigger asChild onClick={props.onTriggerClick}>
        {props.children}
      </HovercardTrigger>
      <HovercardContent className="Summon" side={props.side}>
        <div className="top">
          <div className="title">
            <h4>{props.gridSummon.object.name[locale]}</h4>
            <img
              alt={props.gridSummon.object.name[locale]}
              src={summonImage()}
            />
          </div>
          <div className="subInfo">
            <div className="icons">
              <WeaponLabelIcon
                labelType={Element[props.gridSummon.object.element]}
              />
            </div>
            <UncapIndicator
              type="summon"
              ulb={props.gridSummon.object.uncap.ulb || false}
              flb={props.gridSummon.object.uncap.flb || false}
              xlb={props.gridSummon.object.uncap.xlb || false}
              transcendenceStage={props.gridSummon.transcendence_step}
              special={false}
            />
          </div>
        </div>
        {wikiButton}
      </HovercardContent>
    </Hovercard>
  )
}

export default SummonHovercard
