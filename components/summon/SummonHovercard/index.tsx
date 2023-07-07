import React from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'

import {
  Hovercard,
  HovercardContent,
  HovercardTrigger,
} from '~components/common/Hovercard'
import Button from '~components/common/Button'
import HovercardHeader from '~components/HovercardHeader'

import styles from './index.module.scss'

interface Props {
  gridSummon: GridSummon
  children: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  onTriggerClick: () => void
}

const SummonHovercard = (props: Props) => {
  const { t } = useTranslation('common')

  const tintElement = props.gridSummon.object.element.slug

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
        upgradedSummons.indexOf(summon.granblueId.toString()) != -1 &&
        props.gridSummon.uncapLevel == 5
      ) {
        suffix = '_02'
      } else if (
        props.gridSummon.object.uncap.xlb &&
        props.gridSummon.transcendenceStep > 0
      ) {
        suffix = '_03'
      }

      // Generate the correct source for the summon
      imgSrc = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/summon-grid/${summon.granblueId}${suffix}.jpg`
    }

    return imgSrc
  }

  const wikiButton = (
    <Button
      className={tintElement}
      text={t('buttons.wiki')}
      onClick={goTo}
      bound={true}
    />
  )

  return (
    <Hovercard openDelay={350}>
      <HovercardTrigger asChild onClick={props.onTriggerClick}>
        {props.children}
      </HovercardTrigger>
      <HovercardContent side={props.side}>
        <HovercardHeader
          gridObject={props.gridSummon}
          object={props.gridSummon.object}
          type="summon"
        />
        {wikiButton}
      </HovercardContent>
    </Hovercard>
  )
}

export default SummonHovercard
